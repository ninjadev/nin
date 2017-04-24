const ClosureCompiler = require('google-closure-compiler-js').webpack;
const p = require('path');
const webpack = require('webpack');


async function dasbootGen(projectPath) {
  return new Promise((resolve, reject) => {
    webpack({
      entry: [
        p.join(__dirname, '..', 'dasBoot', 'bootstrap.js')
      ],
      output: {
        path: p.join(projectPath, 'gen'),
        filename: 'dasBoot.js',
      },
      plugins: [
        new ClosureCompiler({
          options: {
            languageIn: 'ECMASCRIPT6',
            languageOut: 'ECMASCRIPT5',
            compilationLevel: 'SIMPLE',
            warningLevel: 'VERBOSE',
            externs: ['GU', 'FILES', 'PROJECT', 'SHADERS'],
          },
        })
      ]
    }).run(err => {
      err ? reject() : resolve();
    });
  });
}

module.exports = dasbootGen;
