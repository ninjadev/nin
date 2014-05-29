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
  console.log('mordi');
	if (program.compile){
    console.log('compiling...');
    compile.compile(function(compiled){
      console.log(compiled);
      fs.writeFileSync('test-project/bin/test-project.png.html',
                       compiled, function(err){
        console.log(err);
      });
      console.log('compiling complete!');  
    });
  } 
	else if (program.run){
    run.run();
  }
  else {
    console.log('Usage:'); /*TODO: add default help */
  }
})();
