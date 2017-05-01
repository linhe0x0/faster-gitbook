const async = require('async')
const deploy = require('./libs/deploy')
const utils = require('./libs/utils')
const md5Cache = require('./libs/md5Cache')
const schedule = require('node-schedule')

const job = function job() {
  utils.getTasks((err, tasks) => {
    if (err) return console.error(err)

    const start = Date.now()

    async.map(tasks, deploy, (err, results) => {
      const time = utils.timeHumanize(Date.now() - start)

      const success = tasks.filter((item, i) => results[i])
      const failure = tasks.filter((item, i) => !results[i])

      async.each(failure, md5Cache.clean)

      console.log(`Done. Success: ${success.length}, Failure: ${failure.length}. Total time: ${time}.`)
    })
  })
}

job()

schedule.scheduleJob('0 0 0 * * *', job)
