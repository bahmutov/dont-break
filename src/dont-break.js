require('shelljs/global');
/* global cp */

require('lazy-ass');
var check = require('check-more-types');
var path = require('path');
var quote = require('quote');

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

var npm = require('./top-dependents');
la(check.schema({
  downloads: check.fn,
  sortedByDownloads: check.fn,
  topDependents: check.fn
}, npm), 'invalid npm methods', npm);

function saveTopDependents(name, metric, n) {
  la(check.unemptyString(name), 'invalid package name', name);
  la(check.unemptyString(metric), 'invalid metric', metric);
  la(check.positiveNumber(n), 'invalid top number', n);

  var fetchTop = _.partial(npm.downloads, metric);
  return npm.topDependents(name, n)
    .then(fetchTop)
    .then(npm.sortedByDownloads)
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

function getDependents(options, name) {
  options = options || {};
  var forName = name || pkg.name;

  var firstStep;

  var metric, n;
  if (check.number(options.topDownloads)) {
    metric = 'downloads';
    n = options.topDownloads;
  } else if (check.number(options.topStarred)) {
    metric = 'starred';
    n = options.topStarred;
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

function dontBreak(options) {
  options = options || {};

  return getDependents(options).then(function (dependents) {
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

module.exports = dontBreak;
