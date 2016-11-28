const fs = require('fs');
const path = require('path');
const utils = require('../utils');
const graph = require('../graph');
const mkdirp = require('mkdirp');

const generate = function(projectRoot, type, name, options) {
  if (type == '' || name == '') {
    return;
  }

  const camelizedName = utils.camelize(name);

  switch (type) {
    case 'node':
      generateLayer(camelizedName,
        'TemplateNode.js',
        [[/TemplateNode/g, camelizedName]],
        projectRoot);

      graph.transform(projectRoot, function(g) {
        g.push(Object.assign({
          id: name,
          type: camelizedName,
        }, options));
      }, function(err) {
        if (err) {
          console.error(err);
        } else {
          console.log('Added ' + name + ' to graph.json');
        }
      });
      break;

    case 'shader':
      generateShader(camelizedName, projectRoot);
      break;

    case 'shaderWithLayer': {
      const shaderLayerName = camelizedName + 'Layer';

      generateShader(camelizedName, projectRoot);
      generateLayer(shaderLayerName, 'TemplateShaderLayer.js',
        [[/TemplateLayer/g, shaderLayerName],
          [/TemplateShader/g, camelizedName]],
        projectRoot);

      // NOOP. Not yet implemented
      graph.transform(projectRoot, graph => graph, function (err) {
        if (err) {
          console.error(err);
        } else {
          console.log('Added ' + shaderLayerName + ' to layers.json');
        }
      });
      break;
    }

    default:
      process.stderr.write('Attempted to generate resource without generator:', type, '\n');
  }
};

const generateShader = function(shaderName, projectRoot) {
  const targetShaderPath = path.join(projectRoot, 'src', 'shaders', shaderName),
    templateShaderPath = path.join(__dirname, 'templateShader');

  mkdirp.sync(targetShaderPath);
  fs.readdirSync(templateShaderPath).forEach(function (fileName) {
    const from = path.join(templateShaderPath, fileName),
      to = path.join(targetShaderPath, fileName);
    fs.createReadStream(from).pipe(fs.createWriteStream(to));
  });

  process.stdout.write('Generated shader ' + shaderName + '\n');
};

const generateLayer = function(layerName, templateFile, filters, projectRoot) {
  const layerFileName = layerName + '.js';
  const newLayer = path.join(projectRoot, 'src', layerFileName);

  mkdirp.sync(path.join(projectRoot, 'src'));
  if (fs.existsSync(newLayer)) {
    process.stderr.write('Layer ' + layerFileName + ' already exists\n');
    process.exit(1);
  }

  templateFile = path.join(__dirname, templateFile);
  let templateLayer = fs.readFileSync(templateFile, 'utf-8');

  for (let i=0; i<filters.length; i++) {
    templateLayer = templateLayer.replace(filters[i][0], filters[i][1]);
  }

  fs.writeFileSync(newLayer, templateLayer);

  process.stdout.write('Generated layer ' + layerFileName + '\n');
};

module.exports = {generate};
