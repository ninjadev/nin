#!/usr/bin/env node

var program = require('commander');

program
  .version('0.0.1')
  .option('compile', 'Compile the nin project')
  .option('run', 'Run the nin project')
  .parse(process.argv);

if (program.compile) console.log('Compiling...');
else if (program.run) console.log('Running...');
