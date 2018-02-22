'use strict'

var la = require('lazy-ass')
var check = require('check-more-types')
var npmTest = require('npm-utils').test
la(check.fn(npmTest), 'npm test should be a function', npmTest)

function runInFolder (folder, command, messages) {
  la(check.unemptyString(command), messages.missing, command)
  la(check.unemptyString(folder), 'expected folder', folder)
  var cwd = process.cwd()
  process.chdir(folder)
  return npmTest(command).then(function () {
    console.log(`${messages.success} in ${folder}`)
    return folder
  })
    .catch(function (errors) {
      console.error(`${messages.failure} in ${folder}`)
      console.error('code', errors.code)
      throw errors
    })
    .finally(function () {
      process.chdir(cwd)
    })
}

module.exports = runInFolder
