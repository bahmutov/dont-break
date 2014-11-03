#!/usr/bin/env node

(function checkForUpdates() {
  var updateNotifier = require('update-notifier');
  var pkg = require(__dirname + '/package.json');
  var notifier = updateNotifier({
    packageName: pkg.name,
    packageVersion: pkg.version
  });
  if (notifier.update) {
    notifier.notify();
  }
}());

require('shelljs/global');
/* global cp */

require('lazy-ass');
var check = require('check-more-types');

var program = require('commander');
program
  .usage('dont-break')
  .option('-t, --top <n>', 'Top N dependent modules to check', parseInt)
  .parse(process.argv);

var _ = require('lodash');
var q = require('q');
var install = require('npm-utils').install;
la(check.fn(install), 'install should be a function', install);
var npmTest = require('npm-utils').test;
la(check.fn(npmTest), 'npm test should be a function', npmTest);
var path = require('path');
var fs = require('fs');
var pkg = require(path.join(process.cwd(), './package.json'));
la(check.unemptyString(pkg.version), 'could not get package version', pkg);

var Registry = require('npm-registry');
var npm = new Registry();

var downloads = {};

function sortByDownloads() {
  var list = _.pairs(downloads);
  // [[name, n], [name, n], ...]
  var sorted = _.sortBy(list, '1').reverse();
  // sorts by number, largest first
  var names = _.map(sorted, '0');
  return names;
}

function fetchDownloads(name) {
  la(check.unemptyString(name), 'invalid package name', name);

  return q.nmapply(npm.downloads, 'totals', ['last-week', name])
    .then(function (stats) {
      la(check.array(stats) && stats.length === 1, 'expected single stats', stats);
      la(check.number(stats[0].downloads), 'invalid number of downloads', stats);

      downloads[name] = stats[0].downloads;
      console.log(name, 'has been downloaded', downloads[name], 'times');
    });
}

function fetchDownloadsForEachDependent(dependents) {
  la(check.arrayOfStrings(dependents), dependents);

  var actions = dependents.map(function (name) {
    return _.partial(fetchDownloads, name);
  });
  console.log('preparing number of downloads for dependents', dependents);

  var fetchSequence = actions.reduce(q.when, q());
  return fetchSequence;
}

function getTopDependents(name, n) {
  la(check.unemptyString(name), 'missing package name');
  la(check.positiveNumber(n), 'invalid top dependents to check', n);
  console.log('fetching top', n, 'dependent projects for', name);

  return q.nmapply(npm.packages, 'depended', [name]).then(function (dependents) {
    la(check.array(dependents),
      'expected modules dependent on', name, 'to be array', dependents);
    // console.log('modules dependent on', name, dependents);
    var names = _.pluck(dependents, 'name');
    return _.first(names, 5);
  });
}

function saveTopDependents(name, n) {
  return getTopDependents(name, n)
    .then(fetchDownloadsForEachDependent)
    .then(sortByDownloads)
    .then(function (dependents) {
      la(check.array(dependents), 'cannot select top n, not a list', dependents);
      return _.first(dependents, program.top);
    });
}

function getDependents() {
  if (check.number(program.top)) {
    return saveTopDependents(pkg.name, program.top);
  }

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
    // jshint -W030
    err && err.message && console.error(err.message);
  }).done();
}

// dontBreak();
// fetchDownloads('check-types').done();
// getTopDependents('check-types', 5).done();
saveTopDependents('check-types', 5).done();
