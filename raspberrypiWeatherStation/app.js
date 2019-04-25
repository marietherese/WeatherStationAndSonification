'use strict'

let express = require('express')
let home = require('./routes/home.js')
let actions = require('./routes/actions.js')
let model = require('./routes/model.js')
let properties = require('./routes/properties.js')
let bodyParser = require('body-parser')
let cors = require('cors')

let app = express()
let port = 8000;

app.use(cors())
app.use(bodyParser.json())


app.use('/', home)
app.use('/model', model)
app.use('/properties', properties)
app.use('/actions', actions)

app.listen(port, function () {console.log(`Server started on port ${port}.`)})
