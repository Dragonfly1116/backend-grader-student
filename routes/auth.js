const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')

const jwt = require('jsonwebtoken')
const User = require('../model/users');

const passport = require('passport')

// REGISTER  
router.post('/register', (req,res,next) => {

    const email = req.body.email
    const password = req.body.password
    const name = req.body.name
    if(email === '' || password === '' || name === '')
        return res.status(400).json('BAD REQUEST')
    bcrypt.hash(password, 10, (err,hashed) => {
        if(err) {
            return res.status(500).json(err)
        } else {
            const newUser = new User({
                email: email,
                password: hashed,
                name: name,
                status: 'user',
                progress: [],
                submit: []    
            })
            newUser.save()
                .then( result => res.status(200).json(result))
                .catch( err => res.status(500).json(err))
        }
    })
})

// SIGN IN

router.post('/login', (req,res,next) => {

    passport.authenticate('local', (err, token) => {     
        if(err || !token){
          const error = new Error('An Error occured')
          return res.status(401).json(error);
        }
        return res.status(200).json({token: token});

    })(req, res)

})
module.exports = router