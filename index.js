#!/usr/bin/env node

require('lazy-ass');
var check = require('check-more-types');
var q = require('q');
var install = require('npm-utils').install;
la(check.fn(install), 'install should be a function', install);
var path = require('path');
var fs = require('fs');

var pkg = require('./package.json');
la(check.unemptyString(pkg.version), 'could not get package version', pkg);

function getDependents() {
  var read = require('fs').readFile;
  return q.nfcall(read, './.dont-break', 'utf-8')
    .then(function (text) {
      return text.split('\n').filter(function (line) {
        return line.length;
      });
    })
    .fail(function () {
      // the file does not exist probably
      return [];
    });
}

function testDependent(dependent) {
  la(check.unemptyString(dependent), 'invalid dependent', dependent);
  console.log('testing', dependent);

  var toFolder = '/tmp/' + dependent + '-' + pkg.version;

  return install({
    name: dependent,
    prefix: toFolder
  }).then(function () {
    console.log('installed into', toFolder);
    return path.join(toFolder, 'lib/node_modules/' + dependent);
  }).then(function (folder) {
    la(check.unemptyString(folder), 'expected folder', folder);
    la(fs.existsSync(folder), 'expected existing folder', folder);
    return folder;
  });
}

function testDependents(dependents) {
  la(check.array(dependents), dependents);
  var testers = dependents.map(testDependent);
  return testers.reduce(q.when, q(true));
}

function dontBreak() {
  return getDependents().then(function (dependents) {
    la(check.arrayOfStrings(dependents), 'invalid dependents', dependents);
    console.log('dependents', dependents);

    return testDependents(dependents)
      .then(function () {
        console.log('all dependents tested');
      });
  }).done();
}

testDependent('dont-break-foo-user')
.then(function (folder) {
  la(check.unemptyString(folder), 'expected install folder', folder);
  la(fs.existsSync(folder), 'cannot find install folder', folder);
  console.log('installed into folder', folder);
}).done();
