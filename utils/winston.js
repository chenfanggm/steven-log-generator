'use strict'

const winston = require('winston')
const config = require('../config')
require('winston-daily-rotate-file')

const logger = new (winston.Logger)({
  level: config.log.level,
  transports: [
    new (winston.transports.Console)({
      json: true,
      colorize: config.log.colorize
    }),
    new (winston.transports.DailyRotateFile)({
      name: 'server-log',
      filename: './logs/server.log',
      datePattern: 'yyyy-MM-dd.',
      prepend: true,
      json: true,
      colorize: false
    })
  ]
})

module.exports = {
  instance: logger,
  reqPreprocess: (req, res, next) => {
    req.requestStartTime = Date.now()
    next()
  },
  dynamicMeta: (req, res) => {
    return { timestamp: req.requestStartTime }
  }
}
