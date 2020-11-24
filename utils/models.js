const mongoose = require('mongoose')

let postSchema = new mongoose.Schema({
    content: String,
    email: String
})

let Post = mongoose.model('Post', postSchema)

let userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }]
})

let User = mongoose.model('User', userSchema)

module.exports = {User, Post}