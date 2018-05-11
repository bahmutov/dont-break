'use strict'

var q = require('q')
var isRepoUrl = require('./is-repo-url')
var debug = require('debug')('dont-break')
var exists = require('fs').existsSync
var rimraf = require('rimraf')

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
  let cmd = options.cmd || 'npm install'
  let res
  if (!exists(options.prefix)) {
    mkdirp.sync(options.prefix)
  }
  if (isRepoUrl(options.name)) {
    debug('installing repo %s', options.name)
    removeFolder(options.prefix)
    res = q(cloneRepo({
      url: options.name,
      folder: options.prefix
    })).then(function () {
      console.log('cloned %s', options.name)
    })
    .catch(function (err) {
      console.error('smth went wrong', err)
      throw err
    })
  } else {
    if (options.name) {
      cmd = `${cmd} ${options.name}`
    }
    res = Promise.resolve()
  }

  return res.then(function () {
    return runInFolder(options.prefix, cmd, {
      success: 'installing dependent module succeeded',
      failure: 'installing dependent module failed'
    })
  })
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
