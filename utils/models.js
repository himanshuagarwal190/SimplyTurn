const mongoose = require('mongoose')

let userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String
})

module.exports = mongoose.model('User', userSchema)