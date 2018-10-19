const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email: { type: String, required: true, unique: true},
    name: String,
    password: String,
    status: String,
    progress: [{
        problem_name: String,
        pass: Boolean,
        score: String
    }],
    submit: [{
        problem_name: String,
        date: Date,
        time: String,
        memory: String,
        compile: String,
        score: String,
        key: String
    }]    
});

module.exports = mongoose.model('User', UserSchema);