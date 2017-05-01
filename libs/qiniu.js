const path = require('path')
const qiniu = require('qiniu')
const config = require('../config')

qiniu.conf.ACCESS_KEY = config.accessKey
qiniu.conf.SECRET_KEY = config.secretKey

const client = new qiniu.rs.Client()

const bucket = config.bucket

const uptoken = function uptoken(filename) {
  const putPolicy = new qiniu.rs.PutPolicy(bucket + ":" + filename)

  return putPolicy.token()
}

const generateFileName = function generateFileName(filePath) {
  return filePath.replace('repos/', '').replace('_book/', '')
}

exports.upload = function upload(filePath, callback) {
  const filename = generateFileName(filePath)

  const token = uptoken(filename)

  const extra = new qiniu.io.PutExtra()

  qiniu.io.putFile(token, filename, filePath, extra, (err, response) => {
    if (err) return callback(err)

    return callback(null, response)
  })
}

exports.update = function update(filePath, callback) {
  const filename = generateFileName(filePath)

  client.remove(bucket, filename, (err, response) => {
    if (err) return callback(err)

    return exports.upload(filePath, callback)
  })
}
