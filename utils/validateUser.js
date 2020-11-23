const jwt = require('jsonwebtoken')
jwt_secret = process.env.jwt_secret

function validateUser (req, res, next) {
    jwt.verify(req.cookies.token, jwt_secret, (err, decoded) =>{
        if(err) {
            res.redirect('/login')
        }
        else {
            next()
        }
    })
}

function isLoggedIn (req, res, next) {
    jwt.verify(req.cookies.token, jwt_secret, (err, decoded) =>{
        if(err) {
            next()
        }
        else {
            res.redirect('/home')
        }
    })
}

module.exports = {validateUser, isLoggedIn}