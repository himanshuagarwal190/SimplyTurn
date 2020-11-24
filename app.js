// Importing packages
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const sha256 = require('js-sha256')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
require('dotenv').config()

const {User, Post} = require('./utils/models')
const {validateUser, isLoggedIn} = require('./utils/validateMiddleware')

//Intialization
const app = express()
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
mongoose.set('useUnifiedTopology', true)
mongoose.connect(process.env.mongodb, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false})
let port = process.env.PORT || 3000
const jwt_secret = process.env.jwt_secret

app.get('/', isLoggedIn, (req, res) =>{
    res.render('index')
})


// Login Route
app.get('/login', isLoggedIn, (req, res) =>{
    let user_msg = (req.query.user_msg === 'true')
    let password_msg = (req.query.password_msg === 'true')
    res.render('login', {user_msg:user_msg, password_msg:password_msg})
})

// Auth route to authouize user
app.post('/auth', (req, res) =>{
    User.findOne({email:req.body.email}, (err, data) =>{
        // If email does not exists
        if(data === null) {
            res.redirect('login/?user_msg=true&password_msg=false')
        }
        // Database error
        else if(err) {
            console.log(err)
            res.redirect('/')
        }
        // If email exists
        else {
            let password = sha256(req.body.password)
            // If password matches
            if(password === data.password){
                let token = jwt.sign({name: data.name, role: data.role}, jwt_secret)
                res.cookie('token', token, {httpOnly: true});
                res.cookie('uuid', data._id)
                res.cookie('name', data.name);
                res.cookie('role', data.role)
                res.redirect('/home')
            }
            // If password is incorrect
            else {
                res.redirect('login/?user_msg=false&password_msg=true')
            }
        }
    })
})

// SignupChoice Route
app.get('/signupChoice', isLoggedIn, (req, res) =>{
    res.render('teacherOrStudent')
})

// Signup Route (GET)
app.get('/signup', isLoggedIn, (req, res) =>{
    if(req.query.option === 'Student') {
        res.render('studentSignUp', {password_msg: false, email_msg: false})
    }
    else if(req.query.option === 'Teacher') {
        res.render('teacherSignUp', {password_msg: false, email_msg: false})
    }
    else {
        console.log('Wrong signup option')
        res.redirect('/')
    }
})

// Signup Route (Post)
app.post('/signup', isLoggedIn, async (req, res) =>{
    let user = {name: req.body.name,
                email: req.body.email,
                password: await sha256(req.body.password),
                role: req.body.role}

    // Check if password matches
    if(req.body.password !== req.body.confirm_password) {
        if(user.role === 'Teacher') {
            res.render('teacherSignUp', {password_msg: true, email_msg: false})
        }
        else if(user.role === 'Student') {
            res.render('teacherSignUp', {password_msg: true, email_msg: false})
        }
    }
    // Check if email already exist in database
    else if(await User.exists({email: req.body.email})) {
        if(user.role === 'Teacher') {
            res.render('teacherSignUp', {password_msg: false, email_msg: true})
        }
        else if(user.role === 'Student') {
            res.render('teacherSignUp', {password_msg: false, email_msg: true})
        }
    }
    // Create user in the database
    else {
        User.create(user, (err, data) =>{
            if(err){
                console.log(err)
                res.redirect('/')
            }
            else{
                console.log(data)
                res.redirect('/home')
            }
        })
    }
})

// Home route where posts will be displayed
app.get('/home', validateUser, (req, res) =>{
    let posts = []
    if(req.cookies.role === 'Student'){
        User.findById(req.cookies.uuid).populate('posts').exec((err, data) =>{
            if(err){
                console.log(err)
                res.redirect('/')
            }
            else{
                res.render('home', {name:req.cookies.name, posts: data.posts, edit: true})
            }
        })
    }
    else if(req.cookies.role === 'Teacher'){
        User.find({role: 'Student'}).populate('posts').exec((err, data) =>{
            if(err){
                console.log(err)
                res.redirect('/')
            }
            else{
                let posts = []
                data.forEach(user =>{
                    posts.push(...user.posts)
                })
                res.render('home', {name:req.cookies.name, posts: posts, edit:false})
            }
        })
    }
})

// For adding new Post (GET)
app.get('/newPost', (req, res) =>{
    res.render('newPost', {name:req.cookies.name})
})

// For adding new Post (POST)
app.post('/newPost', (req, res) =>{
    let uuid = req.cookies.uuid
    let post = req.body.post
    User.findById(uuid, (err, userdata) =>{
        if(err){
            console.log(err)
            res.redirect('/')
        }
        else {
            let email = userdata.email
            Post.create({content: post, email: email}, (err, postdata) =>{
                if(err){
                    console.log(err)
                    res.redirect('/')
                }
                else{
                    userdata.posts.push(postdata)
                    userdata.save((err, done) =>{
                        if(err){
                            console.log(err)
                            res.redirect('/')
                        }
                        else{
                            res.redirect('/home')
                        }
                    })
                }
            })
        }
    })
})

// For Editing Post (GET)
app.get('/edit/:id', (req, res) =>{
    Post.findById(req.params.id, (err, data) =>{
        if(err){
            console.log(err)
            res.redirect('/')
        }
        else {
            res.render('edit', {name: req.cookies.name, data: data})
        }
    })
})

// For Editing Post (POST)
app.post('/edit', (req, res) =>{
    Post.findByIdAndUpdate(req.body.postId,{content: req.body.postUpdate},(err, data) => {
        if(err) {
            console.log(err)
            res.redirect('/')
        }
        else {
            res.redirect('/home')
        }
    })
})

// For deleting post
app.post('/delete', (req, res) =>{
    Post.findByIdAndRemove(req.body.postId, (err, data) =>{
        if(err){
            console.log(err)
            res.redirect('/')
        }
        else {
            res.redirect('/home')
        }
    })
})

// Logout route
app.get('/logout', (req, res) =>{
    res.clearCookie('name')
    res.clearCookie('token')
    res.clearCookie('uuid')
    res.clearCookie('role')
    res.redirect('/')
})

// Start Server
app.listen(port, () =>{
    console.log(`Server running on port ${port}`)
})