const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProblemSchema = new Schema({
    name: { type: String, required: true, unique: true},
    time_limit: Number,
    extra_time: Number,
    wall_time_limit: Number,
    memory_limit: Number,
    stack_limit: Number,
    max_process: Number,
    max_file_size: Number,
    process_time: Boolean,
    process_memory: Boolean,
    lang: Array,
    stdin: Array,
    stdout: Array,
    pdf: String
});

module.exports = mongoose.model('Problem', ProblemSchema);