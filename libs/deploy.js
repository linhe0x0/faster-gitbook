const path = require('path')
const async = require('async')
const utils = require('./utils')
const md5Cache = require('./md5Cache')
const qiniu = require('./qiniu')
const config = require('../config')

const deploy = function deploy(taskConfigurationFile, callback) {
  const taskName = utils.getFileName(taskConfigurationFile)

  console.log(`Start a new task <${taskName}>.`)
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

    utils.exists(taskName, (exists) => {
      if (exists) {
        utils.exec(`git pull origin ${config.branch}`, { cwd: `repos/${taskName}` }, cb)
      } else {
        const url = `https://github.com/${config.repo}.git`

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
        return callback(null, dir)
      }

      if (err) return callback(err)

      if (results[0] === results[1].HEAD) return callback('This document is up to date.')

      return callback(null, dir)
    })
  }

  // 4. build gitbook contents.
  const build = function build(dir, callback) {
    utils.exec('gitbook install', { cwd: dir }, (err) => {
      if (err) return callback(err)

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
      console.error(`${taskName}: `, err)

      return callback(null, typeof err === 'string')
    }

    const time = utils.timeHumanize(Date.now() - start)

    console.log(`The task <${taskName}> has been uploaded. Total time: ${time}.`)
    console.log(`You can visit it at http://${config.host}/${taskName}/`)

    return callback(null, true)
  })
}

module.exports = deploy
