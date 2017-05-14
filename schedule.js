const schedule = require('node-schedule')
const job = require('./app')

schedule.scheduleJob('0 0 0 * * *', job)
