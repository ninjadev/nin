const fs = require('fs-promise');
const path = require('path');
const utils = require('../utils');
const graph = require('../graph');

const generate = async function(projectRoot, type, name, options) {
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
          console.log(`-> added ${name} to graph.json`);
        }
      });
      break;

    case 'threeNode':
      generateLayer(camelizedName,
        'TemplateTHREENode.js',
        [[/TemplateTHREENode/g, camelizedName]],
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
          console.log(`-> added ${name} to graph.json`);
        }
      });
      break;

    case 'shaderNode':
      {
        const shaderFilename = name + 'Node';
        generateLayer(shaderFilename,
          'TemplateShaderNode.js',
          [[/TemplateShaderNode/g, shaderFilename]],
          projectRoot);

        await fs.copy(
          path.join(__dirname, 'templateShader'),
          path.join(projectRoot, 'src', 'shaders', name)
        );
        console.log(`-> added ${name} to src`);

        graph.transform(projectRoot, graph => {
          graph.push({
            id: name,
            type: shaderFilename,
            options: {
              shader: name,
            },
          });
        }, err => {
          if (err) {
            console.error(err);
          } else {
            console.log(`-> added ${shaderFilename} to graph.json`);
          }
        });
      }
      break;

    default:
      process.stderr.write(`Attempted to generate resource without generator: ${type}\n`);
  }
};

const generateLayer = function(layerName, templateFile, filters, projectRoot) {
  const layerFileName = layerName + '.js';
  const newLayer = path.join(projectRoot, 'src', layerFileName);

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
  console.log(`-> added ${layerFileName} to src`);
};

module.exports = {generate};
