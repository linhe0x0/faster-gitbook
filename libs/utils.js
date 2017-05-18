const fs = require('fs')
const path = require('path')
const exec = require('child_process').exec

const bookDir = path.resolve(__dirname, '../books')

exports.getTasks = function getTasks(callback) {
  fs.readdir(bookDir, callback)
}

exports.getTaskConfig = function getTaskConfig(filename, callback) {
  const file = path.join(bookDir, filename)

  fs.readFile(file, 'utf8', callback)
}

exports.getFileName = function getFileName(file) {
  return path.parse(file).name
}

exports.exists = function isExists(dir, callback) {
  fs.access(dir, (err) => {
    if (err) return callback(false)

    return callback(true)
  })
}

exports.exec = function ex(command, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  exec(command, options, (err) => {
    if (err) return callback(err)

    callback(null)
  })
}

exports.getHeadHash = function getHeadHash(repo, callback) {
  exec('git rev-parse HEAD', { cwd: repo }, (err, stdout) => {
    if (err) return callback(err)

    return callback(null, stdout.toString().slice(0, -1))
  })
}

exports.findAlllFiles = function findAlllFiles(dirname, callback) {
  let total = 0
  const results = []

  ;(function rd(dir, cb) {
    fs.readdir(dir, (err, files) => {
      if (err) return callback(err)

      total += files.length

      ;(function next(i) {
        if (i < files.length) {
          const pathname = path.join(dir, files[i])

          fs.stat(pathname, (err, stat) => {
            if (err) return callback(err)

            if (stat.isDirectory()) {
              total -= 1
              rd(pathname, () => next(i + 1))
            } else {
              results.push(pathname)
              next(i + 1)
            }
          })
        } else {
          if (results.length === total) {
            return callback(null, results)
          } else {
            cb && cb()
          }
        }
      })(0)
    })
  })(dirname)
}

exports.timeHumanize = function timeHumanize(timestamp) {
  const minutes = parseInt((timestamp / 1000 / 60), 10)
  const seconds = parseInt((timestamp / 1000 % 60), 10)

  return minutes ? `${minutes} mins ${seconds} seconds.` : `${seconds} seconds`
}
