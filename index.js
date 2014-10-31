#!/usr/bin/env node

require('shelljs/global');
require('lazy-ass');
var check = require('check-more-types');
var q = require('q');
var install = require('npm-utils').install;
la(check.fn(install), 'install should be a function', install);
var npmTest = require('npm-utils').test;
la(check.fn(npmTest), 'npm test should be a function', npmTest);
var path = require('path');
var fs = require('fs');

var pkg = require(path.join(process.cwd(), './package.json'));
la(check.unemptyString(pkg.version), 'could not get package version', pkg);

function getDependents() {
  var read = require('fs').readFile;
  return q.nfcall(read, './.dont-break', 'utf-8')
    .then(function (text) {
      return text.split('\n').filter(function (line) {
        return line.length;
      });
    })
    .catch(function () {
      // the file does not exist probably
      return [];
    });
}

function testInFolder(folder) {
  la(check.unemptyString(folder), 'expected folder', folder);
  var cwd = process.cwd();
  process.chdir(folder);
  return npmTest().then(function () {
    console.log('tests work in', folder);
    return folder;
  })
  .catch(function (errors) {
    console.error('tests did not work in', folder);
    console.error('code', errors.code);
    throw errors;
  })
  .finally(function () {
    process.chdir(cwd);
  });
}

function testCurrentModuleInDependent(dependentFolder) {
  la(check.unemptyString(dependentFolder), 'expected dependent folder', dependentFolder);
  var currentModuleName = pkg.name;
  var fullPath = path.join(dependentFolder, 'node_modules/' + currentModuleName);
  la(fs.existsSync(fullPath), 'cannot find', fullPath);

  var thisFolder = process.cwd() + '/*';
  cp('-rf', thisFolder, fullPath);

  console.log('copied', thisFolder, 'to', fullPath);
  return dependentFolder;
}

function testDependent(dependent) {
  la(check.unemptyString(dependent), 'invalid dependent', dependent);
  console.log('testing', dependent);

  var toFolder = '/tmp/' + pkg.name + '@' + pkg.version + '-against-' + dependent;

  return install({
    name: dependent,
    prefix: toFolder
  }).then(function formFullFolderName() {
    console.log('installed into', toFolder);
    return path.join(toFolder, 'lib/node_modules/' + dependent);
  }).then(function checkInstalledFolder(folder) {
    la(check.unemptyString(folder), 'expected folder', folder);
    la(fs.existsSync(folder), 'expected existing folder', folder);
    return folder;
  })
  .then(function installDependencies(folder) {
    console.log('installing dev dependencies', folder);
    var cwd = process.cwd();
    process.chdir(folder);
    return install({}).then(function () {
      console.log('restoring current directory', cwd);
      process.chdir(cwd);
      return folder;
    }, function (err) {
      console.error('Could not install dependencies in', folder);
      console.error(err);
      throw err;
    });
  })
  .then(testInFolder)
  .then(testCurrentModuleInDependent)
  .then(testInFolder);
}

function testDependents(dependents) {
  la(check.array(dependents), dependents);
  return dependents.reduce(function (prev, dependent) {
    return prev.then(function () {
      return testDependent(dependent);
    });
  }, q(true));
}

function dontBreak() {
  return getDependents().then(function (dependents) {
    la(check.arrayOfStrings(dependents), 'invalid dependents', dependents);
    console.log('dependents', dependents);

    return testDependents(dependents)
      .then(function () {
        console.log('all dependents tested');
      });
  }).then(function () {
    console.log('PASS: Current version does not break dependents');
  }, function (err) {
    console.log('FAIL: Current version break dependents');
    err && err.message && console.error(err.message);
  }).done();
}

dontBreak();
