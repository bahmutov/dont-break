'use strict'

const q = require('q')
const la = require('lazy-ass')
const check = require('check-more-types')
const isRepoUrl = require('./is-repo-url')
const debug = require('debug')('dont-break')
const exists = require('fs').existsSync
const rimraf = require('rimraf')
const chdir = require('chdir-promise')

const npmInstall = require('npm-utils').install
la(check.fn(npmInstall), 'install should be a function', npmInstall)
const cloneRepo = require('ggit').cloneRepo

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
    })).then(() => {
      console.log('cloned %s', options.name)
    })
    .then(() => chdir.to(options.prefix))
    .then(() => {
      console.log('running NPM install in %s', process.cwd())
    })
    .then(npmInstall)
    .finally(chdir.from)
  } else {
    return q(npmInstall(options))
  }
}

module.exports = install

if (!module.parent) {
  // quick and dirty test of module install
  const join = require('path').join
  const osTmpdir = require('os-tmpdir')
  const folder = join(osTmpdir(), 'test-install')
  console.log('tmp folder for testing')
  console.log(folder)

  install({
    // name: 'boggle-connect',
    name: 'https://github.com/bahmutov/dont-break-bar',
    prefix: folder
  })
  .then(() => {
    console.log('all done')
  }, (err) => {
    console.error('Could not install')
    console.error(err)
  })
}
