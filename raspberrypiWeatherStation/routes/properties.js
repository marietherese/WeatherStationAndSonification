'use strict'

let express = require('express')
let router = express.Router()
let weather = require('../model/weather.js')

router.use((req, res, next) => {
    next()
  })

router.route('/')
.get(async (req, res) => { 
    try { 
        let pressure = await weather.getBarometerReading()
        let luminosity = await weather.getLuminosityReading()        
        let temperatureAndHumidity = await weather.getTemperatureAndHumidityReading()
        console.log(pressure)
        res.json([
            {
                id: 'temperature',
                name: 'Temperature',
                description: 'Temperature in °C',
                values: {
                    temperature: temperatureAndHumidity.temperature,
                    },
                sensorType: 'DHT22',
                range: '-40°C - 80°C',
                timeStamp: new Date(),
                link: '/properties/temperature'
            },
            {
                id: 'humidity',
                name: 'Humidity',
                description: 'Humidity in %',
                values: {
                    humidity: temperatureAndHumidity.humidity,
                    },
                sensorType: 'DHT22',
                range: '0-100%',
                timeStamp: new Date(),
                link: '/properties/humidity'
            },
            {
                id: 'luminosity',
                name: 'Luminosity',
                description: 'Luminosity in lux',
                values: {
                    luminosity,
                    },
                sensorType: 'TSL2561',
                range: '0.1 - 40000 lux',
                timeStamp: new Date(),
                link: '/properties/luminosity'
                },
                {
                    id: 'pressure',
                    name: 'Pressure',
                    description: 'Barometric pressuere in hPa',
                    values: {
                        pressure
                        },
                    sensorType: 'BMP280',
                    range: '300 - 1100 hPa',
                    timeStamp: new Date(),
                    link: '/properties/pressure'
                }           
            ])
    }  catch (err) {
        res.sendStatus(500)
        console.log(err)
    } 
})

router.route('/temperature')
.get( async (req, res) => { 
    try { 
        let temperatureAndHumidity = await weather.getTemperatureAndHumidityReading()

        res.json(
            {
                id: 'temperature',
                name: 'Temperature',
                description: 'Temperature in °C',
                values: {
                    temperature: temperatureAndHumidity.temperature,
                    },
                unit: '°C',
                timeStamp: new Date()
            })
    }  catch (err) {
        res.sendStatus(500)
        console.log(err)
    } 
})

router.route('/humidity')
.get( async (req, res) => { 
    try { 
        let temperatureAndHumidity = await weather.getTemperatureAndHumidityReading()

        res.json(
            {
                id: 'humidity',
                name: 'Humidity',
                description: 'Humidity in %',
                values: {
                    temperature: temperatureAndHumidity.humidity,
                    },
                unit: '%',
                timeStamp: new Date()
            })
    }  catch (err) {
        res.sendStatus(500)
        console.log(err)
    } 
})

router.route('/luminosity')
.get( async (req, res) => { 
    try { 
        let luminosity = await weather.getLuminosityReading()

        res.json(
            {
                id: 'luminosity',
                name: 'Luminosity',
                description: 'Luminosity in lux',
                values: {
                    luminosity                    },
                unit: 'lux',
                timeStamp: new Date()
            })
    }  catch (err) {
        res.sendStatus(500)
        console.log(err)
    } 
})

router.route('/pressure')
.get( async (req, res) => { 
    try { 
        let pressure = await weather.getBarometerReading()

        res.json(
            {
                id: 'pressure',
                name: 'Pressure',
                description: 'Pressure in hPa',
                values: {
                    pressure: pressure                    },
                unit: 'hPa',
                timeStamp: new Date()
            })
    }  catch (err) {
        res.sendStatus(500)
        console.log(err)
    } 
})




module.exports = router
