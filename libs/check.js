#!/usr/bin/env node

const async = require('async')
const chalk = require('chalk')
const utils = require('./utils')

let tasks = null

const getAllTasksContent = function getAllTasksContent(files, callback) {
  tasks = files

  async.map(files, utils.getTaskConfig, callback)
}

const isJSONFormat = function isJSONFormat(str, file) {
  try {
    JSON.parse(str)
  } catch(err) {
    console.error(chalk.red(file, ': ', err.message))
    return false
  }

  return true
}

const checkGrammar = function checkGrammar(contents, callback) {
  const results = contents.map((item, index) => {
    return isJSONFormat(item, tasks[index])
  })

  callback(null, results)
}

const check = function check() {
  async.waterfall([
    utils.getTasks,
    getAllTasksContent,
    checkGrammar,
  ], (err, results) => {
    if (err) {
      console.error(chalk.red(err))
      return process.exit(9)
    }

    if (results.includes(false)) {
      console.log()
      console.error(chalk.red('We found some invalid configuration files. You have to fix them.'))
      return process.exit(9)
    }

    console.error(chalk.green('Great! All configuration files are vaild.'))
    return process.exit(0)
  })
}

check()
