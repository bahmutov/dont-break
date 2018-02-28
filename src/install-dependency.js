'use strict'

var q = require('q')
var isRepoUrl = require('./is-repo-url')
var debug = require('debug')('dont-break')
var exists = require('fs').existsSync
var rimraf = require('rimraf')
var chdir = require('chdir-promise')

var cloneRepo = require('ggit').cloneRepo
var runInFolder = require('./run-in-folder')
var mkdirp = require('mkdirp')

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
    .catch(function (err) {
      console.error('smth went wrong', err)
      throw err
    })
    .finally(chdir.from)
  } else {
    if (!exists(options.prefix)) {
      mkdirp.sync(options.prefix)
    }
    var cmd = options.cmd || 'npm install'
    options.installAddWord = options.installAddWord || ''
    if (options.name) {
      cmd = `${cmd} ${options.installAddWord} ${options.name}`
    }
    console.log('running "%s" install command in %s', cmd, options.prefix)
    return runInFolder(options.prefix, cmd, {
      success: 'installing dependent module succeeded',
      failure: 'installing dependent module failed'
    })
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
