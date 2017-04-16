const p = require('path');
const readDir = require('readdir');
const concat = require('concat-files');


function dasbootGen(projectPath, cb) {
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
  concat(dasBootLibSourceFilePaths.concat(dasBootSourceFilePaths),
         dasBootDestinationFilePath,
         cb);
}

module.exports = dasbootGen;
