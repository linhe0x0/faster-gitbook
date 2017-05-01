const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const utils = require('./utils')

const dir = path.resolve(__dirname, '../md5_cache')

exports.computed = function computed(filePath, callback) {
  const rs = fs.createReadStream(filePath)
  const hash = crypto.createHash('md5')

  rs.on('data', hash.update.bind(hash))

  rs.on('end', () => {
    return callback(null, hash.digest('hex'))
  })
}

exports.get = function get(filename, callback) {
  const file = path.join(dir, filename) + '.json'
  
  fs.readFile(`${file}`, 'utf8', (err, content) => {
    if (err) return callback(err)

    try {
      const cache = JSON.parse(content)

      return callback(null, cache)
    } catch (err) {
      return callback(err)
    }
  })
}

exports.set = function set(filename, hash) {
  const file = path.join(dir, filename) + '.json'

  let bak = {}

  const read = function readFile(cb) {
    return fs.readFile(file, 'utf8', (err, data) => {
      if (err) return cb(err)

      try {
        bak = JSON.parse(data)
      } catch(err) {
        return cb(err)
      }
    })
  }

  const write = function writeFile() {
    Object.keys(hash).forEach((item) => {
      bak[item] = hash[item]
    })

    const str = JSON.stringify(bak, null, 4)

    return fs.writeFile(file, str, () => {})
  }

  utils.exists(`${file}.json`, (result) => {
    if (!result) {
      return write()
    }

    read((err) => {
      if (err) return

      write()
    })
  }) 
}

exports.clean = function clean(filename, callback) {
  const file = path.join(dir, filename)

  fs.unlink(file, (err) => {
    if (err) return callback(err)

    callback(null)
  })
}
