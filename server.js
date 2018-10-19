const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./config/keys').keysURI;
const passport = require('passport')

const AuthChecker = require('./utils/AuthChecker')



// passport configure 
app.use(passport.initialize())

const localLogin = require('./passport/local-login')
passport.use(localLogin)

// 


app.use(bodyParser.json());
app.use(cors());


// Api middleware

app.use('/api',AuthChecker)

app.use('/uploads',express.static('./uploads'))

const userAPI = require('./routes/users');
const authenticationAPi = require('./routes/auth')
const problemAPI = require('./routes/problem')

app.use('/api/users/',userAPI)
app.use('/api/problem',problemAPI)
app.use('/auth',authenticationAPi)

//

// Database 
mongoose
    .connect(db)
    .then( () => console.log('Connect Database'))
    .catch( err => console.log(err))
//


const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Run on port ${port}`))