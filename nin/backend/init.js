const chalk = require('chalk');
const child_process = require('child_process');
const {copy} = require('fs-promise');
const generate = require('./generate/generate');
const path = require('path');
const projectSettings = require('./projectSettings');


async function init(dirname) {
  const projectPath = path.join(process.cwd(), dirname);

  try {
    await copy(path.join(__dirname, 'blank-project'), projectPath);
    child_process.execSync(
        `git init ${projectPath}`,
        {stdio: 'inherit'});
    generate.generate(projectPath, 'node', 'SpinningCube');
    projectSettings.init(projectPath);
    console.log(chalk.green(`${projectPath} is now a nin project. Run`),
                chalk.cyan('nin run'),
                chalk.green('inside to serve your project!'));

  } catch(e) {
    console.log(chalk.red(e));
    process.exit(1);
  }
}

module.exports = {init: init};
