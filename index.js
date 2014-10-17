#!/usr/bin/env node

require('lazy-ass');
var check = require('check-more-types');
var q = require('q');

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
  return q(true);
}

function testDependents(dependents) {
  la(check.array(dependents), dependents);
  var testers = dependents.map(testDependent);
  return testers.reduce(q.when, q(true));
}

getDependents().then(function (dependents) {
  la(check.arrayOfStrings(dependents), 'invalid dependents', dependents);
  console.log('dependents', dependents);

  return testDependents(dependents)
    .then(function () {
      console.log('all dependents tested');
    });
}).done();
