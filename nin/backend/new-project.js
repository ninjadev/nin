const chalk = require('chalk');
const child_process = require('child_process');
const fs = require('fs-extra');
const generate = require('./generate/generate');
const path = require('path');
const projectSettings = require('./projectSettings');


module.exports = async function newProject(dirname) {
  const projectPath = path.join(process.cwd(), dirname);

  try {
    await fs.copy(path.join(__dirname, 'blank-project'), projectPath);
    child_process.execSync(
        `git init ${projectPath}`,
        {stdio: 'inherit'});
    generate.generate(projectPath, 'threeNode', 'SpinningCube');
    projectSettings.init(projectPath);
    console.log(chalk.green(`${projectPath} is now a nin project. Run`),
                chalk.cyan('nin run'),
                chalk.green('inside to serve your project!'));

  } catch(e) {
    console.log(chalk.red(e));
    process.exit(1);
  }
};
