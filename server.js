'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const methodOverride = require('method-override')
const cors = require('cors')
const validator = require('express-validator')
const compression = require('compression')
const helmet = require('helmet')
const httpStatus = require('http-status')
// const mongoose = require('mongoose')
// const util = require('util')
const debug = require('debug')('app:server')
const expressWinston = require('express-winston')
const winston = require('./utils/winston')
const errorHandler = require('./middlewares/errorHandler')
const APIError = require('./utils/APIError')
const routes = require('./routes')
const config = require('./config')

// ========================================================
// Init
// ========================================================
const __DEV__ = config.env === 'development'
const __TEST__ = config.env === 'test'

const initEnvironment = () => {
  const fs = require('fs')
  const logDir = './logs'
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir)
  }
}
initEnvironment()

// ========================================================
// Express
// ========================================================
const app = express()

/*
 debug('Init mongoose...')
 mongoose.Promise = require('bluebird')
 mongoose.connect(config.mongo.uri, { server: { socketOptions: { keepAlive: 1 } } })
 mongoose.connection.on('error', function () {
 throw new Error('Failed to connect to database:' + config.mongo.uri)
 })
 if (config.env === 'development') {
 mongoose.set('debug', function (collectionName, method, query, doc) {
 debug(collectionName + '.' + method, util.inspect(query, false, 20), doc)
 })
 }
 */

debug('Init middleware...')
app.use(compression())
app.use(cors(config.cors))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(validator())
app.use(cookieParser())
app.use(methodOverride())
app.use(helmet())

app.use(winston.reqPreprocess)
app.use(expressWinston.logger({
  winstonInstance: winston.instance,
  msg: '[{{req.requestStartTime}}] HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
  level: __DEV__ ? 'debug' : 'info',
  meta: true,
  colorize: false,
  dynamicMeta: winston.dynamicMeta
}))

// routes
app.use('/api/v1', routes)
// static
app.use(express.static('dist'))
// 404
app.use('/', function (req, res, next) {
  next(new APIError('Method Not Found', httpStatus.NOT_FOUND, true))
})

// error transform
app.use(function (err, req, res, next) {
  if (Array.isArray(err)) {
    const unifiedErrorMessage = err.map(function (error) { return error.msg }).join(' and ')
    const error = new APIError(unifiedErrorMessage, httpStatus.BAD_REQUEST, true)
    return next(error)
  } else if (!(err instanceof APIError)) {
    return next(new APIError(err.message, err.status, err.isPublic))
  }
  return next(err)
})

// log error
if (!__TEST__) {
  app.use(expressWinston.errorLogger({
    winstonInstance: winston.instance,
    msg: 'HTTP {{req.method}} {{req.url}} {{err.status}} {{err.message}}',
    dynamicMeta: winston.dynamicMeta
  }))
}

// error handler
app.use(errorHandler())

module.exports = app
