var la = require('lazy-ass');
var check = require('check-more-types');

/* global describe, it */
describe('banner', function () {
  var banner = require('./banner');

  it('is a function', function () {
    la(check.fn(banner));
  });
});
