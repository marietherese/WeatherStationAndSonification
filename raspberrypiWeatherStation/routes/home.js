'use strict'

let express = require('express')
let router = express.Router()

router.use((req, res, next) => {
    next()
  })


router.route('/')
.get((req, res) => {
    res.set({
        'Link': '</model/>; rel="model", </propertie/s>; rel="properties", </actions/>; rel="actions", <http://raspberrypi.local:8000/>; rel="type"'
    })
    res.json({
        id: 'http://raspberrypi.local:8000/',
        name: 'My local weather station',
        description: 'A raspberry pi weather station connected to the local network.',
        tags: ['raspberrypi', 'BMP280', 'TSL2561', 'RHT03'],
        link: [
            {model: '/model'},
            {properties: '/properties'},
            {actions: '/actions'}
        ]
    })
})

module.exports = router