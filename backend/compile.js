var walk = require('walk');
var fs = require('fs');
var exec = require('child_process').exec;
var compress = require('./compress').compress;


function res(callback) {
  var walker = walk.walk('test-project/res/' , {followLinks: false});
  var files = [];
  walker.on('file', function(root, stat, next) {
    var file = fs.readFileSync(root + stat.name);
    files.push('FILES[\'' + root + stat.name + '\']=\'' +
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
        exec('mkdir -p test-project/bin/');
        fs.writeFileSync('test-project/bin/test-project.png.html', data);
        console.log('Success!');
      });
    }
  }
  lib(collect);
  res(function(data) {
    exec('rm -rf test-project/gen/', function(){
      exec('mkdir test-project/gen/', function(){
        fs.writeFileSync('test-project/gen/files.js', new Buffer(data));
        exec('java -jar compiler.jar -O ADVANCED --language_in ECMASCRIPT5 --debug --logging_level INFO test-project/src/*.js test-project/gen/*.js',
             function(error, stdout, stderr){
          stderr && console.log(stderr);
          collect(stdout);
        });
      });
    });
  });
}


module.exports = {compile: compile};
