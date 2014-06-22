var walk = require('walk');
var fs = require('fs');
var exec = require('child_process').exec;
var compress = require('./compress').compress;
var shaderGen = require('./shadergen').shaderGen;

function res(callback) {
  var walker = walk.walk('test-project/res/' , {followLinks: false});
  var files = [];
  walker.on('file', function(root, stat, next) {
    var file = fs.readFileSync(root + stat.name);
    /* slice 13 is a test-project hack */
    files.push('FILES[\'' + root.slice(13) + stat.name + '\']=\'' +
               file.toString('base64') + '\'');
    next();
  });
  walker.on('end', function(){
    callback('FILES={};' + files.join(';') + ';');
  });
}

function lib(callback) {
  var walker = walk.walk('test-project/lib/' , {followLinks: false});
  var files = [];
  walker.on('file', function(root, stat, next) {
    var file = fs.readFileSync(root + stat.name);
    files.push(file);
    next();
  });
  walker.on('end', function(){
    callback(files.join(';') + ';');
  });
}

var compile = function(callback) {
  var compiled = [];
  function collect(data) {
    compiled.push(data); 
    if(compiled.length == 2) {
      compress(compiled.join(';'), function(data) {
        exec('mkdir -p test-project/bin/', function (){
      		fs.writeFileSync('test-project/bin/test-project.png.html', data);
      	});
        console.log('Success!');
      });
    }
  }
  lib(collect);
  res(function(data) {
    exec('rm -rf test-project/gen/', function(){
      exec('mkdir test-project/gen/', function(){
        fs.writeFileSync('test-project/gen/files.js', new Buffer(data));
        shaderGen(function() {
          exec('java -jar compiler.jar -O SIMPLE --language_in ECMASCRIPT5 --debug --logging_level INFO test-project/src/*.js test-project/gen/*.js dasBoot/*.js dasBoot/lib/*.js',
               {encoding: 'binary', maxBuffer: 1024 * 1024 * 1024},
               function(error, stdout, stderr){
            stderr && console.log(stderr);
            collect(stdout);
          });
        }); 
      });
    });
  });
}


module.exports = {compile: compile};
