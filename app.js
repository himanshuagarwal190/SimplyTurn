// Importing packages
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const sha256 = require('js-sha256')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
require('dotenv').config()

const User = require('./models/users')

//Intialization
const app = express()
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
mongoose.set('useUnifiedTopology', true)
mongoose.connect(process.env.mongodb, {useNewUrlParser: true, useUnifiedTopology: true})
let port = process.env.PORT || 3000

app.get('/', (req, res) =>{
    res.render('index')
})

app.get('/login', (req, res) =>{
    res.render('login')
})

app.get('/auth', (req, res) =>{
    
})

app.get('/signupChoice', (req, res) =>{
    res.render('teacherOrStudent')
})

app.get('/signup', (req, res) =>{
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

app.post('/signup', async (req, res) =>{
    let user = {name: req.body.name,
                email: req.body.email,
                password: await sha256(req.body.password),
                role: req.body.role}

    console.log(user)
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
                res.redirect('/')
            }
        })
    }
})

app.listen(port, () =>{
    console.log(`Server running on port ${port}`)
})