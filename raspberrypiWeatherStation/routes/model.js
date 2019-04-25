'use strict'

let express = require('express')
let router = express.Router()

router.use((req, res, next) => {
    next()
  })

router.route('/')
.get((req, res) => {
    res.json({
        id: 'http://raspberrypi.local:8000/',
        name: 'My local weather station',
        description: 'A raspberry pi weather station connected to the local network.',
        tags: ['raspberrypi', 'BMP280', 'TSL2561', 'RHT03/DHT22'],
        hostname: 'http://raspberrypi.local',
        port: '8000',
        link: '/properties',
        title: 'List of properties',
        resources: {
            weather: {
                name: 'Weather',
                description: 'All sensor values collected in an object.',
                values: {
                    temperature: 'The temperature in Celcius.',
                    humidity: 'The air humidity in %.',
                    luminosity: {
                        broadband: 'The luminosity of the full spectrum in lux.',
                        infrared: 'The luminosity of infrared light in lux.',
                        lux: 'The luminosity of visible light in lux.'
                    },
                    pressure: 'The barometric pressure in hPa.'
                }
            }
        },
        actions: {
            link: '/actions',
            title: 'Actions of the weather station',
            resources: {
                weather: {
                    name: 'Start stream of weather data',
                    description: 'Starts a continous stream of updates of weather values to an url.',
                    values: {
                        url: {
                            type: 'string',
                            required: true
                        }
                    },
                    link: '/actions/weather'
                },
                stopWeather: {
                    name: 'Stop stream of weather data',
                    description: 'Stops the continous stream of updates to an url.',
                    values: {
                        url: {
                            type: 'string',
                            required: true
                        }
                    },
                    link: '/actions/stopWeather'
                }
            }
        }
    })
})

module.exports = router

