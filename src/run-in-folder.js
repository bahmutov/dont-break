'use strict'

var la = require('lazy-ass')
var check = require('check-more-types')
var npmTest = require('npm-utils').test
var chdir = require('chdir-promise')

la(check.fn(npmTest), 'npm test should be a function', npmTest)

function runInFolder (folder, command, options) {
  la(check.unemptyString(command), options.missing, command)
  la(check.unemptyString(folder), 'expected folder', folder)

  return chdir.to(folder)
    .then(function () {
      console.log(`running "${command}" from ${folder}`)
      return npmTest(command)
    })
    .then(function () {
      console.log(`${options.success} in ${folder}`)
      return folder
    })
    .catch(function (errors) {
      console.error(`${options.failure} in ${folder}`)
      console.error('code', errors.code)
      throw errors
    })
    .finally(chdir.from)
}

module.exports = runInFolder
