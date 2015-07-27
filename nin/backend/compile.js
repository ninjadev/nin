var walk = require('walk');
var fs = require('fs');
var exec = require('child_process').exec;
var compress = require('./compress').compress;
var shaderGen = require('./shadergen').shaderGen;
var rmdir = require('rimraf');
var p = require('path');
var mkdirp = require('mkdirp');
var projectSettings = require('./projectSettings');

function res(projectPath, callback) {
  var walker = walk.walk(projectPath + '/res/' , {followLinks: false});
  var files = [];
  console.log('going to walk res');
  walker.on('file', function(root, stat, next) {

    /* hacks to ensure slashes in path are correct.
     * TODO: is there a bug in walker that causes
     * these things to happen?  */
    root += '/'
    root = root.replace(/\/\//g, '/');

    var file = fs.readFileSync(root + stat.name);
    console.log('Assimilating ' + stat.name);
    files.push('FILES[\'' + root.slice(projectPath.length + 1) + stat.name + '\']=\'' +
               file.toString('base64') + '\'');
    console.log('OK');
    next();
  });
  walker.on('end', function(){
    console.log('Merging assimilated files');
    callback('FILES={};' + files.join(';') + ';');
    console.log('OK');
  });
}

function lib(projectPath, callback) {
  console.log('going to walk lib');
  var walker = walk.walk(projectPath + '/lib/' , {followLinks: false});
  var files = [];
  walker.on('file', function(root, stat, next) {
    var file = fs.readFileSync(root + stat.name);
    console.log('Incorporating ' + root.slice(13) + stat.name);
    files.push(file);
    console.log('OK');
    next();
  });
  walker.on('end', function(){
    console.log('Merging incorporated files');
    callback(files.join(';') + ';');
    console.log('OK');
  });
}

var compile = function(projectPath, callback) {
  console.log('starting to compile');
  var compiled = [];
  function collect(data) {
    compiled.push(data);
    if (compiled.length == 2) {
      compress(projectPath, compiled.join(';'), function(data) {
        var binPath = p.join(projectPath, '/bin/');
        mkdirp(binPath, function() {
          fs.writeFileSync(projectPath + '/bin/demo.png.html', data);
        });
        console.log('Success!');
      });
    }
  }
  lib(projectPath, collect);
  res(projectPath, function(data) {
    var genPath = p.join(projectPath, '/gen/');
    rmdir(genPath, function(error) {
      mkdirp(genPath, function(error) {
        fs.writeFileSync(projectPath + '/gen/files.js', new Buffer(data));
        projectSettings.load(projectPath);
        shaderGen(projectPath, function() {
          console.log('Running closure compiler...');
          exec('java -jar -Xmx2048m ' + __dirname + '/compiler.jar -O SIMPLE --language_in ECMASCRIPT5 --debug --logging_level INFO ' + __dirname + '/../dasBoot/lib/*.js ' + __dirname + '/../dasBoot/*.js ' + projectPath + '/gen/*.js ' + projectPath + '/src/*.js',
            {encoding: 'binary', maxBuffer: 1024 * 1024 * 1024},
            function(error, stdout, stderr) {
              stderr && console.log(stderr);
              collect(stdout);
            });
        });
      });
    });
  });
};


module.exports = {compile: compile};
