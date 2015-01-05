#!/usr/bin/env node

require('./src/check-updates');

require('shelljs/global');
/* global cp */

var path = require('path');
var dontBreakPackage = require(path.join(__dirname, 'package.json'));
require('lazy-ass');
var check = require('check-more-types');
var quote = require('quote');

console.log(dontBreakPackage.name + '@' + dontBreakPackage.version, '-', dontBreakPackage.description);

var program = require('commander');
program
  .option('-t, --top-downloads <n>',
    'Fetch N most downloaded dependent modules, save and check', parseInt)
  .option('-s, --top-starred <n>',
    'Fetch N most starred dependent modules, save and check', parseInt)
  .parse(process.argv);

var _ = require('lodash');
var q = require('q');
var install = require('npm-utils').install;
la(check.fn(install), 'install should be a function', install);
var npmTest = require('npm-utils').test;
la(check.fn(npmTest), 'npm test should be a function', npmTest);
var fs = require('fs');
var read = fs.readFile;
var write = fs.writeFile;
var stripComments = require('strip-json-comments');
var pkg = require(path.join(process.cwd(), './package.json'));
la(check.unemptyString(pkg.version), 'could not get package version', pkg);
var dontBreakFilename = './.dont-break';

// TODO(gleb): move top dependents logic into separate file or module

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

function topDownloads(name) {
  la(check.unemptyString(name), 'invalid package name', name);
  return q.nmapply(npm.downloads, 'totals', ['last-week', name])
    .then(function statsToDownloads(stats) {
      la(check.array(stats) && stats.length === 1, 'expected single stats', stats);
      la(check.number(stats[0].downloads), 'invalid number of downloads', stats);

      var n = stats[0].downloads;
      downloads[name] = n;
      console.log(name, 'has been downloaded', n, 'times');
      return n;
    });
}

function topStarred(name) {
  la(check.unemptyString(name), 'invalid package name', name);
  return q.nmapply(npm.packages, 'starred', [name])
    .then(function usersToStarred(users) {
      la(check.array(users), 'expected list of users that starred', name, 'not', users);
      var n = users.length;
      downloads[name] = n;
      console.log(name, 'has been starred', n, 'times');
      return n;
    });
}

function fetchDownloads(metric, name) {
  la(metric === 'downloads' || metric === 'starred', 'invalid metric', metric);
  la(check.unemptyString(name), 'invalid package name', name);
  return metric === 'downloads' ? topDownloads(name) : topStarred(name);
}

function fetchDownloadsForEachDependent(metric, dependents) {
  la(check.arrayOfStrings(dependents), 'invalid dependents', dependents);
  var actions = dependents.map(function (name) {
    return _.partial(fetchDownloads, metric, name);
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
    console.log('module', name, 'has', dependents.length, 'dependents');
    var names = _.pluck(dependents, 'name');
    return names;
  });
}

function saveTopDependents(name, metric, n) {
  la(check.unemptyString(name), 'invalid package name', name);
  la(check.unemptyString(metric), 'invalid metric', metric);
  la(check.positiveNumber(n), 'invalid top number', n);

  var fetchTop = _.partial(fetchDownloadsForEachDependent, metric);
  return getTopDependents(name, n)
    .then(fetchTop)
    .then(sortByDownloads)
    .then(function (dependents) {
      la(check.array(dependents), 'cannot select top n, not a list', dependents);
      return _.first(dependents, n);
    })
    .then(function saveToFile(topDependents) {
      la(check.arrayOfStrings(topDependents), 'expected list of top strings', topDependents);
      var str = '// top ' + n + ' most dependent modules by ' + metric + ' for ' + name + '\n';
      str += '// data from NPM registry on ' + (new Date()).toDateString() + '\n';
      str += topDependents.join('\n') + '\n';
      return q.nfcall(write, dontBreakFilename, str, 'utf-8').then(function () {
        console.log('saved top', n, 'dependents for', name, 'by', metric, 'to', dontBreakFilename);
        return topDependents;
      });
    });
}

function getDependentsFromFile() {
  return q.nfcall(read, dontBreakFilename, 'utf-8')
    .then(function (text) {
      text = stripComments(text);
      return text.split('\n').filter(function (line) {
        return line.trim().length;
      });
    })
    .catch(function () {
      // the file does not exist probably
      return [];
    });
}

function getDependents(name) {
  var forName = name || pkg.name;
  var firstStep;

  var metric, n;
  if (check.number(program.topDownloads)) {
    metric = 'downloads';
    n = program.topDownloads;
  } else if (check.number(program.topStarred)) {
    metric = 'starred';
    n = program.topStarred;
  }
  if (check.unemptyString(metric) && check.number(n)) {
    firstStep = saveTopDependents(forName, metric, n);
  }

  return q(firstStep).then(getDependentsFromFile);
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
  console.log('Copying folder', quote(thisFolder), '\nto folder', quote(fullPath));
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
    dependents = _.invoke(dependents, 'trim');
    console.log('testing dependents', dependents);

    return testDependents(dependents)
      .then(function () {
        console.log('all dependents tested');
      });
  }).then(function () {
    console.log('PASS: Current version does not break dependents');
  }, function (err) {
    console.log('FAIL: Current version break dependents');
    if (err && err.message) {
      console.error(err.message);
    }
  }).done();
}

dontBreak();
// fetchDownloads('check-types').done();
// getTopDependents('check-types', 5).done();
// saveTopDependents('check-types', 'downloads', 5).done();
// getDependents('check-more-types').done();
