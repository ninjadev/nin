var fs = require('fs');

var defaultSettings = {
  title: "My project",
  authors: ["Your demoscene handle"],
  description: "This is my project",
  previewImage: "https://raw.githubusercontent.com/ninjadev/nin/master/nin/frontend/app/images/nin-dark.png",
  music: {
    path: "res/music.mp3",
    bpm: 125,
    subdivision: 4
  },
  googleAnalyticsID: "Your GA ID"
};

function init(projectPath) {
  fs.writeFileSync(
    projectPath + '/nin.json',
    new Buffer(JSON.stringify(defaultSettings, null, '  '))
  );
}

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
      if (input[key].constructor === Object) {
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

module.exports = {init: init, load: load, generate: generate};
