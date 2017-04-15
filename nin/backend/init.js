const chalk = require('chalk');
const child_process = require('child_process');
const fs = require('fs');
const generate = require('./generate/generate');
const glob = require('glob');
const path = require('path');
const projectSettings = require('./projectSettings');


function init(dirname) {
  const projectPath = path.join(process.cwd(), dirname);
  try {
    fs.mkdirSync(projectPath);
  } catch (e) {
    console.error(chalk.red(e));
    process.exit(1);
  }

  try {
    child_process.execSync(
        `git init ${projectPath}`,
        {stdio: 'inherit'});
  } catch(e) {
    console.log('Couldn\'t initialize git project');
  }

  glob(path.join(__dirname, 'blank-project/*'), {dot: true}, function(error, files) {
    let numberOfRemainingFiles = files.length;
    function end() {
      if(--numberOfRemainingFiles == 0) {
        generate.generate(projectPath, 'node', 'SpinningCube');
        projectSettings.init(projectPath);
        console.log(chalk.green(`${projectPath} is now a nin project. Run`),
                    chalk.cyan('nin run'),
                    chalk.green('inside to serve your project!'));
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
        }
      );
    });
  });
}

module.exports = {init: init};
