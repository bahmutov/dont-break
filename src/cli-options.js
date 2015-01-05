function list(val) {
  return val.split(',');
}

var program = require('commander');
program
  .option('-t, --top-downloads <n>',
    'Fetch N most downloaded dependent modules, save and check', parseInt)
  .option('-s, --top-starred <n>',
    'Fetch N most starred dependent modules, save and check', parseInt)
  .option('-d, --dep <name1,name2,name3>',
    'Check if current code breaks given dependent project(s)', list)
  .parse(process.argv);

console.log(program);

module.exports = program;
