// Importing packages
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const sha256 = require('js-sha256')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
require('dotenv').config()

const User = require('./utils/models')
const {validateUser, isLoggedIn} = require('./utils/validateUser')

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
        if(data === null) {
            res.redirect('login/?user_msg=true&password_msg=false')
        }
        else if(err) {
            console.log(err)
            res.redirect('/')
        }
        else {
            let password = sha256(req.body.password)
            // If password matches
            console.log(data)
            if(password === data.password){
                let token = jwt.sign({name: data.name, role: data.role}, jwt_secret)
                res.cookie('token', token, {httpOnly: true});
                res.cookie('name', data.name);
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
        console.log('Wrong option')
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
    else if(await User.exists({email: req.body.email})) {
        if(user.role === 'Teacher') {
            res.render('teacherSignUp', {password_msg: false, email_msg: true})
        }
        else if(user.role === 'Student') {
            res.render('teacherSignUp', {password_msg: false, email_msg: true})
        }
    }
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
    res.render('home', {name:req.cookies.name})
})

app.get('/logout', (req, res) =>{
    res.clearCookie('name')
    res.clearCookie('token')
    res.redirect('/')
})

app.listen(port, () =>{
    console.log(`Server running on port ${port}`)
})