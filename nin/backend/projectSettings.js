const fs = require('fs');
const p = require('path');

const defaultSettings = {
  title: 'My project',
  authors: ['Your demoscene handle'],
  description: 'This is my project',
  previewImage: 'https://raw.githubusercontent.com/ninjadev/nin/master/nin/frontend/app/images/nin-dark.png',
  music: {
    path: 'res/music.mp3',
    bpm: 125,
    subdivision: 4,
    BEANOffset: 0,
  },
  googleAnalyticsID: 'Your GA ID'
};

function init(projectPath) {
  fs.writeFileSync(
    p.join(projectPath, 'nin.json'),
    new Buffer(JSON.stringify(defaultSettings, null, '  ') + '\n')
  );
}

function load(projectPath) {
  let rawProjectSettings = fs.readFileSync(p.join(projectPath, 'nin.json'), 'utf8');
  let projectSettings = JSON.parse(rawProjectSettings);
  return traverse(projectSettings, defaultSettings);
}

function write(projectPath, parsedProjectSettings) {
  let projectSettingsFile = 'var PROJECT = ' + JSON.stringify(parsedProjectSettings) + ';';
  fs.writeFileSync(
    p.join(projectPath, 'gen/projectSettings.js'),
    new Buffer(projectSettingsFile)
  );
}

function generate(projectPath) {
  write(projectPath, load(projectPath));
}

function traverse(input, defaults) {
  let output = {};
  for (let key in defaults) {
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
