#!/usr/bin/env node

var dontBreak = require('./src/dont-break');

if (module.parent) {
  module.exports = dontBreak;
} else {
  require('./src/check-updates');

  var join = require('path').join;
  var dontBreakPackage = require(join(__dirname, 'package.json'));
  console.log(dontBreakPackage.name + '@' + dontBreakPackage.version, '-', dontBreakPackage.description);

  var options = require('./src/cli-options');
  dontBreak(options);
}
