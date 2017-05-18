const log4js = require('log4js')

module.exports = function (type) {
  const logger = log4js.getLogger(type)

  if (process.env.NODE_ENV === 'development') {
    logger.level = log4js.levels.DEBUG
  } else {
    logger.level = log4js.levels.INFO
  }

  return logger
}
