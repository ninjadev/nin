#!/usr/bin/env node

var program = require('commander');

var compile = require('./compile'),
    run     = require('./run');

program
  .version('0.0.1')
  .option('compile', 'Compile the nin project')
  .option('run', 'Run the nin project')
  .parse(process.argv);


(function main () {
	if (program.compile){
    compile.compile();
  } 
	else if (program.run){
    run.run();
  }
  else {
    console.log('Usage:'); /*TODO: add default help */
  }
})();
