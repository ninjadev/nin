const webpack = require('webpack');
const p = require('path');


async function dasbootGen(projectPath) {
  return new Promise((resolve, reject) => {
    webpack({
      entry: [
        p.join(__dirname, '..', 'dasBoot', 'bootstrap.js')
      ],
      output: {
        path: p.join(projectPath, 'gen'),
        filename: 'dasBoot.js',
      }
    }).run(err => {
      err ? reject() : resolve();
    });
  });
}

module.exports = dasbootGen;
