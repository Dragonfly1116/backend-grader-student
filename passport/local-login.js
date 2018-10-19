const PassportLocalStrategy = require('passport-local').Strategy

const User = require('../model/users')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
// Login Strategy

module.exports = new PassportLocalStrategy({
    usernameField : 'email',
    passwordField : 'password',
    session: false
}, (email,password,done) => {

    return User.findOne({email: email}, (err,user) => {
        if(err) return done(err)
        
        if(!user) {
            const error = new Error('Incorrect Email or Password')
            error.name = 'IncorrectUser'

            return done(err)
        }
        bcrypt.compare(password,user.password, (err,result) => {
         
            if(err) return done(err)
         
            if(result) {
                const token = jwt.sign({
                    email: email,
                    status: user.status
                    },
                    "secret_key", 
                    { expiresIn: "24h" }
                )

                done(null,token)
            } else {
                const error = new Error('Incorrect Email or Password')
                error.name = 'IncorrectUser'

                return done(error)
            }
        })
    })


}
)