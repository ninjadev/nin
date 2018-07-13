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
      generateNode(camelizedName,
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
      generateNode(camelizedName,
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

    case 'canvasNode':
      generateNode(camelizedName,
        'TemplateCanvasNode.js',
        [[/TemplateCanvasNode/g, camelizedName]],
        projectRoot);

      graph.transform(projectRoot, g => {
        g.push(Object.assign({
          id: name,
          type: camelizedName,

        }, options));
      }, err => {
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
        generateNode(shaderFilename,
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

    case 'overlayNode':
      {
        const shaderFilename = name + 'Node';
        generateNode(shaderFilename,
          'TemplateOverlayNode.js',
          [[/TemplateOverlayNode/g, shaderFilename]],
          projectRoot);

        await fs.copy(
          path.join(__dirname, 'templateOverlayShader'),
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
            connected: {
              overlay: '',
              background: '',
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

const generateNode = async function(nodeName, templateFile, filters, projectRoot) {
  const nodeFilename = nodeName + '.js';
  let templateNode = await fs.readFile(path.join(__dirname, templateFile), 'utf-8');

  for (let [from, to] of filters) {
    templateNode = templateNode.replace(from, to);
  }

  await fs.outputFile(path.join(projectRoot, 'src', nodeFilename), templateNode);
  console.log(`-> added ${nodeFilename} to src`);
};

module.exports = {generate};
