'use strict'

var q = require('q')
var la = require('lazy-ass')
var check = require('check-more-types')
var isRepoUrl = require('./is-repo-url')
var debug = require('debug')('dont-break')
var exists = require('fs').existsSync
var rimraf = require('rimraf')
var chdir = require('chdir-promise')

var npmInstall = require('npm-utils').install
la(check.fn(npmInstall), 'install should be a function', npmInstall)
var cloneRepo = require('ggit').cloneRepo

function removeFolder (folder) {
  if (exists(folder)) {
    debug('removing folder %s', folder)
    rimraf.sync(folder)
  }
}

function install (options) {
  if (isRepoUrl(options.name)) {
    debug('installing repo %s', options.name)
    removeFolder(options.prefix)
    return q(cloneRepo({
      url: options.name,
      folder: options.prefix
    })).then(function () {
      console.log('cloned %s', options.name)
    })
    .then(function () { return chdir.to(options.prefix) })
    .then(function () {
      console.log('running NPM install in %s', process.cwd())
    })
    .finally(chdir.from)
  } else {
    return npmInstall(options)
  }
}

module.exports = install

if (!module.parent) {
  // quick and dirty test of module install
  var join = require('path').join
  var osTmpdir = require('os-tmpdir')
  var folder = join(osTmpdir(), 'test-install')
  console.log('tmp folder for testing')
  console.log(folder)

  install({
    // name: 'boggle-connect',
    name: 'https://github.com/bahmutov/dont-break-bar',
    prefix: folder
  })
  .then(function () {
    console.log('all done')
  }, function (err) {
    console.error('Could not install')
    console.error(err)
  })
}
