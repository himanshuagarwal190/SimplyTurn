const mongoose = require('mongoose')

let postSchema = new mongoose.Schema({
    content: String
})

let userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    posts: [postSchema]
})

module.exports = mongoose.model('User', userSchema)