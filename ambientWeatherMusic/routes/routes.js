'use strict'

let express = require('express')
let router = express.Router()
let server = require('../app').server
let io = require('socket.io')(server)



router.route('/')
.get((req, res, next) => {

    res.render('home')
})




module.exports = router
