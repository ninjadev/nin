var fs = require('fs'),
    path = require('path');

var generate = function(toGenerate, path) {
  var projectRoot = findRoot(path);
  if (projectRoot == '') {
    process.stderr.write('Could not find nin.json in project root\n');
    process.exit(1);
  }

  if (endsWith(toGenerate, 'Layer')) {
    generateLayer(toGenerate, projectRoot);
    addToLayers(toGenerate, projectRoot);
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

function findRoot(currentPath) {
  var up = '';
  do {
    var base = path.join(currentPath, up),
        manifest = path.join(base, 'nin.json');

    if (fs.existsSync(manifest)) {
      return base;
    }

    up += '../';
  } while (base != path.sep)

  return '';
}

function endsWith(string, suffix) {
  return string.indexOf(suffix, string.length - suffix.length) !== -1;
}

module.exports = {generate: generate};
