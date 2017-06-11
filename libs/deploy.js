const path = require('path')
const async = require('async')
const utils = require('./utils')
const md5Cache = require('./md5Cache')
const qiniu = require('./qiniu')
const config = require('../config')
const log = require('./logger')

const deploy = function deploy(taskConfigurationFile, callback) {
  let logger = null

  const taskName = utils.getFileName(taskConfigurationFile)

  logger = log(taskName)

  logger.info(`Start a new task <${taskName}>.`)
  const start = Date.now()

  // 1. get task config.
  const getTaskConfig = function getTaskConfig(callback) {
    utils.getTaskConfig(taskConfigurationFile, (err, content) => {
      if (err) return callback(err)

      return callback(null, JSON.parse(content))
    })
  }

  // 2. get document file with config.repo.
  const fetchFiles = function fetchFiles(config, callback) {
    config.branch = config.branch || 'master'
    config.docs_dirname = config.docs_dirname || ''

    const cb = function cb(err) {
      if (err) return callback(err)

      return callback(null, `repos/${taskName}/${config.docs_dirname}`)
    }

    const dir = path.join(path.resolve(__dirname, '../repos'), taskName)

    utils.exists(dir, (exists) => {
      if (exists) {
        logger.debug('Fetching latest content.')
        utils.exec(`git pull origin ${config.branch}`, { cwd: `repos/${taskName}` }, cb)
      } else {
        const url = `https://github.com/${config.repo}.git`

        logger.debug(`Cloning latest content from ${url}.`)
        utils.exec(`git clone ${url} -b ${config.branch} --depth=1 repos/${taskName}`, cb)
      }
    })
  }

  // 3. check the repo
  const checkRepo = function checkRepo(dir, callback) {
    const getHeadHash = function getHeadHash(cb) {
      utils.getHeadHash(`repos/${taskName}`, cb)
    }

    const getCacheHash = function getCacheHash(cb) {
      md5Cache.get(taskName, cb)
    }

    async.series([ getHeadHash, getCacheHash ], (err, results) => {
      if (err && err.code === 'ENOENT') {
        md5Cache.set(taskName, { HEAD: results[0] })

        logger.debug(`The task repos/${taskName} is added for the first time.`)

        return callback(null, dir)
      }

      if (err) return callback(err)

      if (results[0] === results[1].HEAD) return callback('This document is up to date.')

      md5Cache.set(taskName, { HEAD: results[0] })
      return callback(null, dir)
    })
  }

  // 4. build gitbook contents.
  const build = function build(dir, callback) {
    logger.debug('Installing gitbook dependencies.')

    utils.exec('gitbook install', { cwd: dir }, (err) => {
      if (err) return callback(err)

      logger.debug('Building gitbook document.')
      utils.exec('gitbook build', { cwd: dir }, (err) => {
        if (err) return callback(err)

        return callback(null, path.join(dir, '_book'))
      })
    })
  }

  // 5. diff the files.
  const diff = function diff(dir, callback) {
    const result = {
      modified: [],
      added: [],
    }

    logger.debug('Comparing differences.')

    utils.findAlllFiles(dir, (err, files) => {
      if (err) return callback(err)

      const computedMD5 = function computedMD5(cb) {
        return async.map(files, md5Cache.computed, cb)
      }

      const getCacheHash = function getCacheHash(cb) {
        return md5Cache.get(taskName, cb)
      }

      async.parallel([ computedMD5, getCacheHash ], (err, results) => {
        if (err) return callback(err)

        const [ hash, cache ] = results

        files.forEach((item, i) => {
          if (!cache[item]) {
            result.added.push(item)
          } else if (cache[item] !== hash[i]) {
            result.modified.push(item)
          }

          cache[item] = hash[i]
        })

        md5Cache.set(taskName, cache)

        return callback(null, result)
      })
    })
  }

  // 6. upload contents to qiniu server.
  const upload = function upload(difference, callback) {
    const update = function update(cb) {
      async.each(difference.modified, qiniu.update, cb)
    }

    const up = function up(cb) {
      async.each(difference.added, qiniu.upload, cb)
    }

    logger.debug('Modified %d, Added %s.', difference.modified.length, difference.added.length)
    logger.debug('Uploading documents.')

    if (process.env.NODE_ENV === 'development') {
      logger.debug('Skip upload task because of debug mode.')
      return callback(null)
    }

    async.parallel([ update, up ], (err) => {
      if (err) return callback(err)

      return callback(null)
    })
  }

  async.waterfall([
    getTaskConfig,
    fetchFiles,
    checkRepo,
    build,
    diff,
    upload
  ], (err) => {
    if (err) {
      logger.error(`${taskName}: `, err)

      return callback(null, typeof err === 'string')
    }

    const time = utils.timeHumanize(Date.now() - start)

    logger.info(`The task <${taskName}> has been uploaded. Total time: ${time}.`)
    logger.info(`You can visit it at http://${config.host}/${taskName}/`)

    return callback(null, true)
  })
}

module.exports = deploy
