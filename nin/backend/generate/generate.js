var fs = require('fs'),
    path = require('path'),
    utils = require('../utils'),
    graph = require('../graph'),
    mkdirp = require('mkdirp');

var generate = function(projectRoot, type, name) {
  if (type == '' || name == '') {
    return;
  }

  var camelizedName = utils.camelize(name);

  switch (type) {
    case 'layer':
      var layerName = camelizedName + 'Layer';
      generateLayer(layerName, 'TemplateLayer.js',
          [[/TemplateLayer/g, layerName]],
          projectRoot);

      layers.add(projectRoot, {
        displayName: name,
        type: layerName,
        color: 'red'
      }, function (err) {
        if (err) {
          console.error(err);
        } else {
          console.log('Added ' + layerName + ' to layers.json');
        }
      });
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

      layers.add(projectRoot, {
        displayName: name,
        type: shaderLayerName,
        color: 'pink'
      }, function (err) {
        if (err) {
          console.error(err);
        } else {
          console.log('Added ' + shaderLayerName + ' to layers.json');
        }
      });
      break;

    default:
      process.stderr.write('Attempted to generate resource without generator:', type, '\n');
  }
};

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
};

var generateLayer = function(layerName, templateFile, filters, projectRoot) {
  var layerFileName = layerName + '.js';
  var newLayer = path.join(projectRoot, 'src', layerFileName);

  mkdirp.sync(path.join(projectRoot, 'src'));
  if (fs.existsSync(newLayer)) {
    process.stderr.write('Layer ' + layerFileName + ' already exists\n');
    process.exit(1);
  }

  templateFile = path.join(__dirname, templateFile);
  var templateLayer = fs.readFileSync(templateFile, 'utf-8');

  for (var i=0; i<filters.length; i++) {
    templateLayer = templateLayer.replace(filters[i][0], filters[i][1]);
  }

  fs.writeFileSync(newLayer, templateLayer);

  process.stdout.write('Generated layer ' + layerFileName + '\n');
};

module.exports = {generate: generate};
