var chalk = require('chalk');
var child_process = require('child_process');
var generate = require('./generate/generate');
var path = require('path');
var projectSettings = require('./projectSettings');
var utils = require('./utils');
var glob = require('glob');


function init(projectPath) {
  var root = utils.findProjectRoot(projectPath);
  if(root) {
    console.log(chalk.red('Error: this directory is already a nin project.'));
    process.exit(1); 
  }
  glob(path.join(__dirname, 'blank-project/*'), function(error, files) {
    var numberOfRemainingFiles = files.length;
    function end() {
      if(--numberOfRemainingFiles == 0) {
        generate.generate(projectPath, 'layer', 'SpinningCube');
        projectSettings.init(projectPath);
        console.log(chalk.green('This directory is now a nin project. Do'),
                    chalk.cyan('nin run'),
                    chalk.green('to get started!'));
      }
    }
    files.map(function(file) {
      child_process.execFile('cp', ['-r', file, path.join(projectPath, '/')],
           function(error, stdout, stderr) {
        if(error) {
          console.log(chalk.red(stderr));
          process.exit(1);
        }
        end();
      });
    });
  });
}


module.exports = {init: init};
