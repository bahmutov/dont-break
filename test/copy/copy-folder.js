require('shelljs/global');

cp('-r', './foo/*', './foo-copy');
console.log('copied foo');
