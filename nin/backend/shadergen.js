let fs = require('fs');
let walk = require('walk');
const p = require('path');

const tokenStream = require('glsl-tokenizer/stream');
const ParseStream = require('glsl-parser/stream');
const deparser = require('glsl-deparser');

function optimizeGlsl(glsl) {
  return new Promise((resolve, reject) => {
    try {
      const chunks = [];
      fs.createReadStream(glsl)
        .pipe(tokenStream())
        .pipe(ParseStream())
        .pipe(deparser(false))
        .on('data', chunk => chunks.push(chunk))
        .on('end', () => resolve(chunks.join('')));
    } catch(e) {
      reject(e);
    }
  });
}

function shaderGen(pathPrefix, cb, optimize=false) {
  function traversePath(shaderPath, callback) {
    const directories = [];

    const walker = walk.walk(shaderPath, {followLinks: false});
    walker.on('directories', function(root, stat, next) {
      for (let s of stat) {
        directories.push(s.name);
      }

      next();
    });

    walker.on('end', async function() {
      const out = {};

      for (let directory of directories) {
        const basePath = p.join(shaderPath, directory);

        const uniformPath = p.join(basePath, 'uniforms.json');
        const vertexPath = p.join(basePath, 'vertex.glsl');
        const fragmentPath = p.join(basePath, 'fragment.glsl');

        const uniforms = JSON.parse(fs.readFileSync(uniformPath));
        const vertexShader = optimize ?
          await optimizeGlsl(vertexPath) :
          fs.readFileSync(vertexPath, 'utf8');
        const fragmentShader = optimize ?
          await optimizeGlsl(fragmentPath) :
          fs.readFileSync(fragmentPath, 'utf8');

        out[directory] = {
          uniforms,
          vertexShader,
          fragmentShader,
        };
      }

      callback('SHADERS=' + JSON.stringify(out));
    });
  }

  traversePath(p.join(pathPrefix, 'src', 'shaders'), out => {
    fs.writeFileSync(p.join(pathPrefix, 'gen', 'shaders.js'),
                     out);
    cb(out);
  });
}

module.exports = shaderGen;
