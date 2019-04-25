'use strict'

let express = require('express')
const handlebars = require('express-handlebars')
let router = require('./routes/routes.js')
let bodyParser = require('body-parser')
let cors = require('cors')
let app = express()
let port = 3000;
let request = require('request')
let ngrok = 'http://1511b3e4.ngrok.io/weatherdata'

app.use(cors())
app.use(bodyParser.json())
let payLoadSecret = undefined
let server = app.listen(port, () => console.log(`Server started on port ${port}.`))
let io = require('socket.io')(server)

io.on('connection', (socket) => {
    console.log('A user connected')
    let clientOptions = {
      uri: 'http://192.168.1.183:8000/actions/weather',
      body: JSON.stringify({url: ngrok}),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
  }
  request(clientOptions, (err, res) => {
      if (err) { console.log(err) }
      if (res) {        
        payLoadSecret = JSON.parse(res.body).secret          
      }
  })
  
  socket.on('disconnect', () => {
    console.log('A user disconnected')
      let clientOptions = {
        uri: 'http://192.168.1.183:8000/actions/stopWeather',
        body: JSON.stringify({url: ngrok}),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }
      request(clientOptions, (err, res) => {
            if (err) { console.log(err) }
      })
      payLoadSecret = undefined
    })
  })

app.post('/weatherData', (req, res, next) => {
    if (payLoadSecret === req.get('Authorization')) {
      io.sockets.emit('event', req.body)
      res.sendStatus(200)
    } else {
      res.sendStatus(403)
    }
})

router.route('/weatherData')

app.engine('handlebars', handlebars({
    defaultLayout: 'main'
  }))
app.set('view engine', 'handlebars')
  
app.use(express.static('./public'))

app.use('/', router)

module.exports = server