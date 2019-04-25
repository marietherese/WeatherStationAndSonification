'use strict'

let request = require('request')

let bmp280 = require('bme280-sensor')
const options = {
    i2cBusNo   : 1, 
    i2cAddress : 0x76
  }
let barometer = new bmp280(options)

let tsl2561 = require('ada-tsl2561')
let lumSensor = new tsl2561()

let dht = require('pigpio-dht');
let dataPin = 22;
let dhtType = 22;
let tempHumSensor = dht(dataPin, dhtType);

let luminosity = undefined
let broadband = undefined
let infrared = undefined
let lux = undefined
let pressure = undefined

let intervals = {}

let postWeatherAtInterval = (subscribers, url) => {  
    try {  
        if (url) {
            intervals[`${url}`] = setInterval(getReadings, 2000) 
        }  
        tempHumSensor.on('result', (data) => {
            let weatherData = data
            weatherData.luminosity = luminosity
            weatherData.pressure = pressure 
                subscribers.forEach(async (element) => {
                sendDataToClient(element.url, weatherData, element.secret)
                })                  
        }) 
        tempHumSensor.on('badChecksum', () => {
            console.log('checksum failed')
        }) 
    } catch (err) {
        console.log(err)
    }   
}

let getReadings = async () => {
    await getLuminosityReading()
    await getBarometerReading()
    await tempHumSensor.read()
}

let sendDataToClient = (url, weatherData, secret) => {
    try {
        let clientOptions = {
            uri: url,
            body: JSON.stringify(weatherData),
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `${secret}`
            }
        }
        request(clientOptions, (err, res) => {
            if (err) {
              console.log(err)
            }
        })

    } catch (err) {
        console.log(err)
    }
} 

let stopWeatherAtInterval = (url) => {
    clearInterval(intervals[`${url}`])
}

let getTemperatureAndHumidityReading = () => {
    setInterval(() => { 
       tempHumSensor.read()
   }, 2000)
   return new Promise ((resolve) => {                 
       tempHumSensor.on('result', (data) => {
           resolve(data)
       })
   })
}

let getLuminosityReading = async () => {
    try {
        await lumSensor.init(1)
        let enabled = await lumSensor.isEnabled()
        if(!enabled) {
            await lumSensor.enable()
        }
        broadband = await lumSensor.getBroadband()
        infrared = await lumSensor.getInfrared()
        lux = await lumSensor.getLux()
        luminosity = {'broadband': broadband, 'infrared': infrared, 'lux': lux}  
        return new Promise ((resolve) => {
            resolve(luminosity)
        })
    } catch (err) {
        console.log(err)
    }    
}

let getBarometerReading = async () => {
    let reading
    let readSensorData = async () => {
        let data = await barometer.readSensorData()       
        pressure = data.pressure_hPa             
        return new Promise ((resolve) => {
            resolve(pressure)
        })
       .catch((err) => {
           console.log(err)
       })
  }

  await barometer.init()
  .then( async () => {
   reading = await readSensorData()
  })
  .catch((err) => {console.error(`BMP280 initialization failed: ${err} `)});

  return new Promise ((resolve) => {
        resolve(reading)
    })
}

module.exports = {
    postWeatherAtInterval,
    stopWeatherAtInterval,
    getTemperatureAndHumidityReading,
    getBarometerReading,
    getLuminosityReading


}