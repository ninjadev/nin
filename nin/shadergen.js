var fs = require('fs');
var walk = require('walk');


var shaderGen = function(cb) {
  var walker = walk.walk('test-project/src/shaders/', {followLinks: false});

  var directories = [];

  walker.on('directories', function(root, stat, next) {
    directories.push(stat[0].name);
    next();
  });

  walker.on('end', function() {
    /* compile to gen */
    for(var i = 0; i < directories.length; i++) {
      var out = 'var ' + directories[i] + ' = {';
      var tmpData = fs.readFileSync('test-project/src/shaders/' + directories[i] + '/uniforms.json', 'utf8');
      out += 'uniforms: ' + tmpData + ',';
      tmpData = fs.readFileSync('test-project/src/shaders/' + directories[i] + '/vertex.glsl', 'utf8');
      out += 'vertexShader: ' + JSON.stringify(tmpData) + ',';
      tmpData = fs.readFileSync('test-project/src/shaders/' + directories[i] + '/fragment.glsl', 'utf8');
      out += 'fragmentShader: ' + JSON.stringify(tmpData) + '';
      out += '};\n';
    }
    fs.writeFileSync('test-project/gen/shaders.js', out);
    cb();
  });
}

module.exports = { shaderGen: shaderGen };
