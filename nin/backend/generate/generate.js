var fs = require('fs'),
    path = require('path'),
    utils = require('../utils');

var generate = function(type, name) {
  var projectRoot = utils.findProjectRoot(process.cwd());
  if (projectRoot == '') {
    process.stderr.write('Could not find nin.json in project root\n');
    process.exit(1);
  }

  switch (type) {
    case 'simpleLayer':
      generateLayer(name, projectRoot);
      addToLayers(name, projectRoot);
      break;

    default:
      process.stderr.write('Attempted to generate resource without generator:', type, '\n');
  }
}

var generateLayer = function(layerName, projectRoot) {
  var layerFileName = layerName + '.js';
  var newLayer = path.join(projectRoot, 'src', layerFileName);

  if (fs.existsSync(newLayer)) {
    process.stderr.write('Layer ' + layerFileName + ' already exists\n');
    process.exit(1);
  }

  var templateFile = path.join(__dirname, 'TemplateLayer.js');
  var templateLayer = fs.readFileSync(templateFile, 'utf-8')
    .replace(/TemplateLayer/g, layerName);

  fs.writeFileSync(newLayer, templateLayer);

  process.stdout.write('Generated ' + layerFileName + '\n');
}

function addToLayers(layerName, projectRoot) {
  var layersPath = path.join(projectRoot, 'res', 'layers.json');

  if (!fs.existsSync(layersPath)) {
    process.stderr.write('Could not find layers.json in res folder\n');
    process.exit(1);
  }

  var layers = JSON.parse(fs.readFileSync(layersPath, 'utf-8'));
  layers.unshift({
    type: layerName,
    displayName: layerName,
    startFrame: 0,
    endFrame: 1000,
    color: 'red',
    config: {}
  });

  fs.writeFileSync(layersPath, JSON.stringify(layers, null, 2) + '\n');

  process.stdout.write('Added ' + layerName + ' to layers.json\n');
}

module.exports = {generate: generate};
