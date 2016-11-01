'use strict'

const q = require('q')
const la = require('lazy-ass')
const check = require('check-more-types')

const npmInstall = require('npm-utils').install
la(check.fn(npmInstall), 'install should be a function', npmInstall)

function install (options) {
  return q(npmInstall(options))
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
    name: 'boggle-connect',
    prefix: folder
  })
  .then(() => {
    console.log('all done')
  }, (err) => {
    console.error('Could not install')
    console.error(err)
  })
}
