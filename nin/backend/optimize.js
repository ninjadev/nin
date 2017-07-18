const chalk = require('chalk');
const glob = require('glob');
const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminZopfli = require('imagemin-zopfli');
const p = require('path');

async function optimize(projectPath) {
  const files = glob.sync(`${projectPath}/res/**/*.{jpg,png}`);
  return files.map(file => {
    return imagemin([file], p.dirname(file), {
      plugins: [
        imageminJpegtran(),
        imageminZopfli({more: true}),
      ]
    }).then(files => {
      console.log(chalk.grey('Optimized'), files[0].path);
    });
  });
}

module.exports = {optimize};
