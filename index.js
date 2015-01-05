#!/usr/bin/env node

require('./src/check-updates');

var join = require('path').join;
var dontBreakPackage = require(join(__dirname, 'package.json'));
console.log(dontBreakPackage.name + '@' + dontBreakPackage.version, '-', dontBreakPackage.description);

var options = require('./src/cli-options');
require('./src/dont-break')(options);
