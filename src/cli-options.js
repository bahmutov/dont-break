var program = require('commander');
program
  .option('-t, --top-downloads <n>',
    'Fetch N most downloaded dependent modules, save and check', parseInt)
  .option('-s, --top-starred <n>',
    'Fetch N most starred dependent modules, save and check', parseInt)
  .parse(process.argv);

module.exports = program;
