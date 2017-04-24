const p = require('path');
const readDir = require('readdir');
const fs = require('fs-promise');


async function dasbootGen(projectPath) {
  const dasBootSourceDirectoryPath = p.join(__dirname, '../dasBoot');
  const dasBootLibSourceFilePaths = readDir.readSync(
    dasBootSourceDirectoryPath,
    ['lib/*.js'],
    readDir.ABSOLUTE_PATHS
  ).sort();
  const dasBootSourceFilePaths = readDir.readSync(
    dasBootSourceDirectoryPath,
    ['*.js'],
    readDir.ABSOLUTE_PATHS
  ).sort();

  const dasBootDestinationFilePath = p.join(projectPath, 'gen', 'dasBoot.js');
  const allFiles = dasBootLibSourceFilePaths.concat(dasBootSourceFilePaths);
  Promise.all(allFiles.map(file => fs.readFile(file)))
    .then(files => fs.writeFile(dasBootDestinationFilePath, Buffer.concat(files)));
}

module.exports = dasbootGen;
