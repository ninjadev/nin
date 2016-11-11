let fs = require('fs');
let walk = require('walk');


let shaderGen = function(pathPrefix, cb) {

  function getShaderData(path, type) {
    let data = '';
    if(fs.existsSync(path)) {
      data = fs.readFileSync(path, 'utf8');
    } else {
      data = fs.readFileSync(__dirname + '/../dasBoot/shaders/default' + type, 'utf8');
    }

    return data;
  }

  function traversePath(pathPrefix, callback) {
    let walker = walk.walk(pathPrefix, {followLinks: false});
    walker.on('directories', function(root, stat, next) {
      for(let i = 0; i < stat.length; i++) {
        directories.push(stat[i].name);
      }
      next();
    });

    walker.on('end', function() {
      let path = '';
      let tmpData = '';
      let type = '';
      for(let i = 0; i < directories.length; i++) {
        out += 'SHADERS.' + directories[i] + ' = {';

        type = '/uniforms.json';
        path = pathPrefix + directories[i] + type;
        tmpData = getShaderData(path, type);
        out += 'uniforms: ' + tmpData + ',';

        type = '/vertex.glsl';
        path = pathPrefix + directories[i] + type;
        tmpData = getShaderData(path, type);
        out += 'vertexShader: ' + JSON.stringify(tmpData) + ',';

        type = '/fragment.glsl';
        path = pathPrefix + directories[i] + type;
        tmpData = getShaderData(path, type);
        out += 'fragmentShader: ' + JSON.stringify(tmpData) + '';

        out += '};\n';
      }
      directories = [];
      callback();
    });
  }

  let directories = [];
  let out = 'SHADERS={};';

  traversePath(pathPrefix + '/src/shaders/', function() {
    traversePath(__dirname + '/../dasBoot/shaders/', function() {
      fs.writeFileSync(pathPrefix + '/gen/shaders.js', out);
      cb(out);
    });
  });
};

module.exports = { shaderGen: shaderGen };
