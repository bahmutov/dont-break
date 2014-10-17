#!/usr/bin/env node

require('lazy-ass');
var check = require('check-more-types');

function getDependents() {
  var q = require('q');
  var read = require('fs').readFile;
  return q.nfcall(read, './.dont-break', 'utf-8')
    .fail(function () {
      // the file does not exist probably
      return [];
    });
}

getDependents().then(function (dependents) {
  la(check.arrayOfStrings(dependents), 'invalid dependents', dependents);
  console.log('dependents', dependents);
}).done();
