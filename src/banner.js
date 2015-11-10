var _ = require('lodash');
var hr = require('hr').hr;

function banner() {
  var args = _.toArray(arguments);
  hr('=');
  console.log(args.join(' '));
  hr('-');
}

module.exports = banner;
