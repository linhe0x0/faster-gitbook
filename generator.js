const fs = require('fs')
const path = require('path')
const async = require('async')
const utils = require('./libs/utils')
const config = require('./config')

const getTaskConfig = function getTaskConfig(file, callback) {
  utils.getTaskConfig(file, (err, content) => {
    if (err) return callback(err)

    try {
      const task = JSON.parse(content)
      task.name = utils.getFileName(file)

      return callback(null, task)
    } catch(err) {
      return callback(err)
    }
  })
}

const getTasks = function getTasks(callback) {
  utils.getTasks((err, tasks) => {
    async.map(tasks, getTaskConfig, callback)
  })
}

const generator = function generator(tasks) {
  return tasks.map((item) => {
    docsDirname = item.docs_dirname ? `${item.docs_dirname}/` : ''

    return `- [${item.repo}](http://${config.host}/${item.name}/${docsDirname}) - ${item.title}`
  })
}

const render = function render(tasks, callback) {
  const conts = generator(tasks).join('\n')
  const filePath = path.resolve(__dirname, './README.md')

  fs.readFile(filePath, 'utf8', (err, result) => {
    if (err) return callback(err)

    const docs = result.replace(
      /<!--list-start-->[^]*<!--list-end-->/,
      `<!--list-start-->\n${conts}\n<!--list-end-->`
    )

    fs.writeFile(filePath, docs, callback)
  })
}

async.waterfall([
  getTasks,
  render
], (err) => {
  if (err) {
    console.error(err)
    return process.exit(1)
  }

  return console.log('Done.')
})
