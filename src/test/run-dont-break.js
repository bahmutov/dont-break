var dontBreak = require('../dont-break');
var foo = require('path').join(__dirname, 'foo');
dontBreak(foo).done();
