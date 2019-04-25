'use strict'
let express = require('express')
let router = express.Router()
let crypto = require('crypto')
let verify = require('../model/verify.js')
let weather = require('../model/weather.js')
let subscribers = []

router.use((req, res, next) => {
    next()
  })

router.route('/')
.get((req, res) => { 
    try { 
        res.json([{            
                id: 'weather',
                name: 'Start stream of weather data',
                action: 'POST',
                values: {
                    url: {
                        type: 'string',
                        required: true,
                        contentType: 'application/json'
                    }
                },
                link: '/actions/weather'
            },
            {
                id: 'stopWeather',
                name: 'Stop stream of weather data',
                action: 'POST',
                values: {
                    url: {
                        type: 'string',
                        required: true,
                        contentType: 'application/json'
                    }
                },
                link: 'actions/stopWeather'
            }])
    }  catch (err) {
        res.sendStatus(500)
        console.log(err)
    } 
})

router.route('/weather')
.post (async(req, res) => {
    try {
    await verify.checkUrl(req.body.url).then((result) => {
            if (result) {
                let buf = crypto.randomBytes(20)
                let secret = buf.toString('hex')
                subscribers.push({'url': req.body.url, 'secret': secret})
                weather.postWeatherAtInterval(subscribers, req.body.url)
                res.status(202).json({
                    message: 'Delivery of continous weatherData started',
                    secret: secret
                }) 
            } else {    
                res.status(400).json({
                    message: 'The provided url does not work.'
                })
            }
        })
    } catch (err) {
        res.sendStatus(500)
        console.log(err)
    }
})

router.route('/stopWeather')
.post ((req, res) => {
    try {
        weather.stopWeatherAtInterval(req.body.url)
        subscribers.forEach((element, index) => {
            if (element.url === req.body.url) {
               subscribers = subscribers.splice(index, 1)
            }
        })
        let url = null
        weather.postWeatherAtInterval(subscribers, url)
        res.status(200).json({
            message: 'Delivery of continous weatherData stopped to your adress.'
        })
    } catch (err) {
        res.sendStatus(500)
        console.log(err)
    } 
})

module.exports = router

