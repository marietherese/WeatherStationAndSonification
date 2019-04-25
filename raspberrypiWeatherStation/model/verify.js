'use strict'

let request = require('request')

let checkUrl = async (url) => {
    try {
        let clientOptions = {
            uri: url,
            body: '{"message": "Checking that the url works"}',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
        }
        let result = await request(clientOptions, async (err, res) => {
                if (err) { console.log(err) }
                if (res.statusCode === 200) { 
                    return true
                } else {
                    return false
                }
            })
        return new Promise ((resolve) => {
            resolve(result)
        })
    } catch (err) {
        console.log(err)
    }
} 



module.exports = {
    checkUrl
}