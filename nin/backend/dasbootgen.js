const p = require('path');
const readDir = require('readdir');
const concat = require('concat-files');


async function dasbootGen(projectPath) {
  const dasBootSourceDirectoryPath = p.join(__dirname, '../dasBoot');
  const dasBootLibSourceFilePaths = readDir.readSync(
    dasBootSourceDirectoryPath,
    ['lib/*.js'],
    readDir.ABSOLUTE_PATHS
  ).sort();
  let dasBootSourceFilePaths = readDir.readSync(
    dasBootSourceDirectoryPath,
    ['*.js'],
    readDir.ABSOLUTE_PATHS
  ).sort();

  const dasBootDestinationFilePath = p.join(projectPath, 'gen/dasBoot.js');

  return new Promise(resolve => {
    concat(dasBootLibSourceFilePaths.concat(dasBootSourceFilePaths),
           dasBootDestinationFilePath,
           resolve);
  });
}

module.exports = dasbootGen;
