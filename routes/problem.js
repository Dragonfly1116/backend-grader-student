const multer = require('multer')
const express = require('express')
const router = express.Router()
const fs = require('fs')
const fetch = require('node-fetch')
const axios = require('axios')

const rimraf = require('rimraf')
const Problem = require('../model/problem')

const User = require('../model/users')


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      let dir
      if(!req.body.user) dir = './uploads/' + req.body.name
      else dir = './users-uploads/' + req.body.user
      if(!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
      }
      req.dirfile = dir
      cb(null, dir)
    },
    filename: function (req, file, cb) {
      const fl = Date.now() + file.originalname 
      req.namefile = fl
      cb(null, fl)
    }
  })

const upload = multer({storage: storage})

const fileUpload = upload.fields([  {name: 'output', maxCount: 10},
                                    {name: 'input',maxCount: 10},
                                    {name: 'pdf', maxCount: 1}])

const submitUpload = upload.single('submitfile')


router.post('/submitfile', submitUpload,(req,res,next) => {
  fs.readFile(req.dirfile + '/' + req.namefile, 'utf8', function(err, data) {  
    if (err) throw err;
    return res.status(200).json({name: req.dirfile+ '/' + req.namefile})
  });
})

router.get('/',(req,res,next) => {
  Problem.find()
    .then(result => res.status(200).json(result))
    .catch(err => res.status(500).json(err))
})

router.get('/:problemName',(req,res,next) => {
  Problem.findOne({name: req.params.problemName})
    .then(result => res.status(200).json(result))
    .catch(err => res.status(500).json(err))
})

router.delete('/all', (req,res,next) => {
  Problem.remove({}, (err) => {
    if(!err) return res.status(200).json('remove all')
    return res.status(500).json(err)
  })
})

router.delete('/', (req,res,next) => {
  Problem.findByIdAndRemove({_id: req.body.id}, (err,result) => {
    if(err) return res.status(500).json(err)
    if(!!result) {
      const dir = './uploads/' + result.name
      rimraf(dir, (err) => {
        if(err) {
          console.log("err : " + err)
          throw err
        }
      })
    }
    return res.status(200).json(result)
  })
})

router.post('/',fileUpload, (req,res,next) => {
  let stdin = []
  let stdout = []
  req.files['input'].map( file => {
    stdin = stdin.concat([file.originalname])
  })
  req.files['output'].map( file => {
    stdout = stdout.concat([file.originalname])
  })
  const Data = {
    name: req.body.name,
    time_limit: Number(req.body.time_limit),
    extra_time: Number(req.body.extra_time),
    wall_time_limit: Number(req.body.wall_time_limit),
    memory_limit: Number(req.body.memory_limit),
    stack_limit: Number(req.body.stack_limit),
    max_process: Number(req.body.max_process),
    max_file_size: Number(req.body.max_file_size),
    process_time: (req.body.process_time === 'true') ? true: false,
    process_memory: (req.body.process_memory === 'true') ? true: false,
    lang: JSON.parse(req.body.lang),
    stdin: stdin,
    stdout: stdout,
    pdf: req.files['pdf'][0].originalname
  }
  const newProblem = new Problem(Data)
  newProblem.save().then( result => res.status(200).json({message: 'Add new problem success', result: result}))
    .catch(err => {
      if(err.code !== 11000) {
        rimraf('./uploads/' + req.body.name, (err) => {
          if(err) {
            console.log(err)
            throw err
          }
         })
      }
      return res.status(500).json({message : err})
    })
})                                    

const Submit = (name,email,score,pass,time,memory,compile,key) => {
  return new Promise((resolve,reject) => {
    User.findOne({email: email}, (err,result) => {
      if(err) {
        console.log('Submit' + err)
        reject({message: 'cant find this user'})
      }

      const oldSubmit = result.submit

      let data
      if(score !== 'Processing') {
        // When it not Processing 
        let progress = []
        progress = progress.concat(result.progress)
        const index = progress.findIndex(x => x.problem_name === name)
        if(index > -1) {
          progress[index].pass = pass
          progress[index].score = score
        } else {
          const pg = {
            problem_name: name,
            pass: pass,
            score: score
          }
          progress = progress.concat([pg])
        } 
        
        // Change submit that processing to not processing with key
        let newSubmit = oldSubmit.filter(item => (item.key !== key)) // Remove processing from all submit
        let newArray = []
        var sb = {
          problem_name: name,
          date: new Date(),
          time: time,
          memory: memory,
          compile: compile,
          score: score,
          key: null //If change it to not processing must set key to null
        }
        newArray = newArray.concat([sb])
        newArray = newArray.concat(newSubmit)
        data = {
          submit: newArray,
          progress: progress
        }
      } else {
        // It is Processing submit
        let newArray =[]
        var sb = {
          problem_name: name,
          date: new Date(),
          time: time,
          memory: memory,
          compile: compile,
          score: score,
          key: key
        }
        newArray = newArray.concat([sb])
        newArray = newArray.concat(oldSubmit)
        data = {
          submit: newArray
        }
      }
  
      User.findOneAndUpdate({email: email}, data ,(err,result) => {
        if(err) {
          console.log('FROM SUBMIT findOneUP ' + err)
          reject(err)
        }
        else {
          const toResolve = {
            result: result,
            sb: sb
          }
          resolve(toResolve)
        }
      })
    })
  })
}

const updateSubmit = (req,res,next) => {
  const {problem_name,email,score,pass,time,memory,compile,key} = req.body.process
  Submit(problem_name,email,score,pass,time,memory,compile,key)
    .then( result => {
      req.user = result.result
      next()
    })
    .catch(err => {
      return res.status(500).json(err)
    })
}

const getLang = lang => {
  if(lang === 'C') 
      return 4
  if(lang === 'C++')
      return 10
  if(lang === 'Python')
      return 34
}

const SendApi = (data,i,problemName,stdin,stdout) => {
  return new Promise( async (resolve,reject) => {
      let newstdin = await getText(`http://localhost:5000/uploads/${problemName}/${stdin[i]}`)
      let newstdout = await getText(`http://localhost:5000/uploads/${problemName}/${stdout[i]}`)
      const NEW = {
          stdin: newstdin,
          expected_output: newstdout
      }
      const APIURL = 'https://api.judge0.com'
      const Query = '/submissions?wait=true'
      const JUDGE = Object.assign(NEW,data)
      console.log('Judge of ' + problemName + ' Round ' + i)
      axios.post(APIURL + Query, JUDGE)
          .then( res => {
            resolve(res.data)
            return;
          })
          .catch(err => {
              console.log('FROM SendAPI:' + err)
              reject(err)
          })
  })
}

const getFileSource = (req,res,next) => {
  fs.readFile(req.body.file, 'utf8', function(err, data) {  
    if(err) return res.status(500).json(err)
    req.source_code = data
    next()
  });
}

const getText = url => {
  return new Promise((resolve,reject) => {
      axios.get(url)
          .then(res => {
              resolve(res.data)
          })
          .catch(err => reject(console.log(err)))
  })
}

router.post('/submission', updateSubmit , getFileSource , async (req,res,next) => {
  const { _id, email } = req.user
  const { source_code } = req
  const { stdin, stdout, language,
          data, name } = req.body.submission
  const { key } = req.body.process
  const numTest = stdin.length
  if(numTest !== stdout.length)  return res.status(400).json('TestCase was Wrong! (Please contact admin.)')

  const lang_id = getLang(language)
   
  var newData = {
      "source_code": source_code,
      "language_id": lang_id
  }

  let WorseTime = 0;
  let WorseMem = 0;
  let isPass = true
  let score = ''
  newData = Object.assign(newData,data)
  for(let i = 0;i< numTest;i++) {
    try {
        const result = await SendApi(newData,i,name,stdin,stdout)
        if(result.status.description === 'Compilation Error') {
            isPass = false
            const submission = await Submit(name,email,'Compliation Error',
                isPass,'-','-',result.compile_output,key)
            console.log('User: ' + email + ' Complie Error Killing Process')
            return res.status(200).json(submission.sb)
        } else if (result.status.description === 'Time Limit Exceeded') {
            WorseTime = Math.max(Number(result.time),WorseTime)
            WorseMem = Math.max(result.memory,WorseMem)
            isPass = false
            score += 'T'
        } else {
            WorseTime = Math.max(Number(result.time),WorseTime)
            WorseMem = Math.max(result.memory,WorseMem)
            if(result.status.description !== 'Accepted') {
                isPass = false
                console.log('User: ' + email + ' Wrong')
                score += '-'
            } else {
                console.log('User: ' + email + ' Pass')
              score += 'P'
            }
        }
    } catch (err) {
        console.log('Error try ' + err)
        return res.status(500).json(err)
    }
  }
  const result = await Submit(name,email,score,isPass,WorseTime,WorseMem,null,key)
  console.log('User: ' + email + ' Grading Success')
  return res.status(200).json(result.sb)
})




module.exports = router