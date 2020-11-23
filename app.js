// Importing packages
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const sha256 = require('js-sha256')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
require('dotenv').config()

const User = require('./utils/models')
const {validateUser, isLoggedIn} = require('./utils/validateMiddleware')

//Intialization
const app = express()
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
mongoose.set('useUnifiedTopology', true)
mongoose.connect(process.env.mongodb, {useNewUrlParser: true, useUnifiedTopology: true})
let port = process.env.PORT || 3000
const jwt_secret = process.env.jwt_secret

app.get('/', (req, res) =>{
    res.render('index')
})

app.get('/login', isLoggedIn, (req, res) =>{
    let user_msg = (req.query.user_msg === 'true')
    let password_msg = (req.query.password_msg === 'true')
    res.render('login', {user_msg:user_msg, password_msg:password_msg})
})

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

app.get('/signupChoice', isLoggedIn, (req, res) =>{
    res.render('teacherOrStudent')
})

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

app.get('/home', validateUser, (req, res) =>{
    let posts = []
    if(req.cookies.role === 'Student'){
        User.findById(req.cookies.uuid, (err, data) =>{
            if(err){
                console.log(error)
                res.redirect('/')
            }
            else {
                posts.push(...data.posts)
                res.render('homeStudent', {name:req.cookies.name, posts: posts})
            }
        })
    }
    else if(req.cookies.role === 'Teacher'){
        User.find({role: 'Student'}, (err, data) =>{
            if(err){
                console.log(error)
                res.redirect('/')
            }
            else {
                data.forEach(user => {
                    posts.push(user.posts)
                });
                res.render('homeStudent', {name:req.cookies.name, posts: posts})
            }
        })
    }
})

app.get('/newPost', (req, res) =>{
    res.render('newPost', {name:req.cookies.name})
})

app.post('/newPost', (req, res) =>{
    let uuid = req.cookies.uuid
    let post = req.body.post
    User.findById(uuid, (err, data) =>{
        if(err){
            console.log(err)
            res.redirect('/')
        }
        else {
            data.posts.push({content: post})
            data.save()
            res.redirect('/home')
        }
    })
})

app.get('/logout', (req, res) =>{
    res.clearCookie('name')
    res.clearCookie('token')
    res.clearCookie('uuid')
    res.clearCookie('role')
    res.redirect('/')
})

app.listen(port, () =>{
    console.log(`Server running on port ${port}`)
})