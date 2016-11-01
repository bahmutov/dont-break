var la = require('lazy-ass')

/* global describe, it */
describe('dont-break utils', function () {
  var join = require('path').join

  it('can join wildcards', function () {
    var result = join('foo', 'bar', '*')
    la(result === 'foo/bar/*', result)
  })
})
