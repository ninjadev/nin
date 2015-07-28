var fs = require('fs'),
    path = require('path'),
    utils = require('../utils'),
    mkdirp = require('mkdirp');

var generate = function(type, name) {
  var projectRoot = utils.findProjectRoot(process.cwd());
  if (projectRoot == '') {
    process.stderr.write('Could not find nin.json in project root\n');
    process.exit(1);
  }

  if (name == "") {
    return;
  }

  var camelizedName = utils.camelize(name);

  switch (type) {
    case 'layer':
      generateLayer(camelizedName, 'TemplateLayer.js',
          [[/TemplateLayer/g, camelizedName]],
          projectRoot);

      addToLayers(camelizedName, 'red', projectRoot);
      break;

    case 'shader':
      generateShader(camelizedName, projectRoot);
      break;

    case 'shaderWithLayer':
      var shaderLayerName = camelizedName + 'Layer';

      generateShader(camelizedName, projectRoot);
      generateLayer(shaderLayerName, 'TemplateShaderLayer.js',
          [[/TemplateLayer/g, shaderLayerName],
           [/TemplateShader/g, camelizedName]],
          projectRoot);

      addToLayers(camelizedName + 'Layer', 'pink', projectRoot);
      break;

    default:
      process.stderr.write('Attempted to generate resource without generator:', type, '\n');
  }
}

var generateShader = function(shaderName, projectRoot) {
  var targetShaderPath = path.join(projectRoot, 'src', 'shaders', shaderName),
      templateShaderPath = path.join(__dirname, 'templateShader');

  mkdirp.sync(targetShaderPath);
  fs.readdirSync(templateShaderPath).forEach(function (fileName) {
    var from = path.join(templateShaderPath, fileName),
        to = path.join(targetShaderPath, fileName);
    fs.createReadStream(from).pipe(fs.createWriteStream(to));
  });

  process.stdout.write('Generated shader ' + shaderName + '\n');
}

var generateLayer = function(layerName, templateFile, filters, projectRoot) {
  var layerFileName = layerName + '.js';
  var newLayer = path.join(projectRoot, 'src', layerFileName);

  if (fs.existsSync(newLayer)) {
    process.stderr.write('Layer ' + layerFileName + ' already exists\n');
    process.exit(1);
  }

  var templateFile = path.join(__dirname, templateFile);
  var templateLayer = fs.readFileSync(templateFile, 'utf-8');

  for (var i=0; i<filters.length; i++) {
    templateLayer = templateLayer.replace(filters[i][0], filters[i][1]);
  }

  fs.writeFileSync(newLayer, templateLayer);

  process.stdout.write('Generated layer ' + layerFileName + '\n');
};

function addToLayers(layerName, color, projectRoot) {
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
    color: color,
    config: {}
  });

  fs.writeFileSync(layersPath, JSON.stringify(layers, null, 2) + '\n');

  process.stdout.write('Added ' + layerName + ' to layers.json\n');
}

module.exports = {generate: generate};
