var fs = require('fs');

var defaultSettings = {
  music: {
    bpm: 110,
    subdivision: 6
  }
};

function load(projectPath) {
  var rawProjectSettings = fs.readFileSync(projectPath + '/nin.json', 'utf8');
  var projectSettings = JSON.parse(rawProjectSettings);
  return traverse(projectSettings, defaultSettings);
}

function write(projectPath, parsedProjectSettings) {
  var projectSettingsFile = 'var PROJECT = ' + JSON.stringify(parsedProjectSettings) + ';';
  fs.writeFileSync(
    projectPath + '/gen/projectSettings.js',
    new Buffer(projectSettingsFile)
  );
}

function generate(projectPath) {
  write(projectPath, load(projectPath));
}

function traverse(input, defaults) {
  var output = {};
  for (var key in defaults) {
    if (key in input) {
      if (typeof input[key] === 'object') {
        output[key] = traverse(input[key], defaults[key]);
      } else {
        output[key] = input[key];
      }
    } else {
      output[key] = defaults[key];
    }
  }
  return output;
}

module.exports = {load: load, generate: generate};
