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
var postinstall = require('npm-utils').test
la(check.fn(npmInstall), 'install should be a function', npmInstall)
la(check.fn(postinstall), 'postinstall should be a function', postinstall)
var cloneRepo = require('ggit').cloneRepo

function removeFolder (folder) {
  if (exists(folder)) {
    debug('removing folder %s', folder)
    rimraf.sync(folder)
  }
}

function install (options) {
  var postInstall = function (arg) {
    if (options.postinstall) {
      console.log('running ' + options.postinstall + ' in %s', process.cwd())
      return postinstall(options.postinstall).then(function () {
        return arg
      })
    } else {
      return arg
    }
  }

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
    .then(npmInstall)
    .then(postInstall)
    .finally(chdir.from)
  } else {
    return npmInstall(options).then(postInstall)
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
