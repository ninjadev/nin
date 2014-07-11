var walk = require('walk');
var fs = require('fs');
var exec = require('child_process').exec;
var compress = require('./compress').compress;
var shaderGen = require('./shadergen').shaderGen;

function res(callback) {
  var walker = walk.walk('test-project/res/' , {followLinks: false});
  var files = [];
  console.log('going to walk res');
  walker.on('file', function(root, stat, next) {

    /* hacks to ensure slashes in path are correct.
     * TODO: is there a bug in walker that causes
     * these things to happen?  */
    root += '/'
    root = root.replace(/\/\//g, '/');

    var file = fs.readFileSync(root + stat.name);
    /* slice 13 is a test-project hack */
    console.log('Assimilating ' + root.slice(13) + stat.name);
    files.push('FILES[\'' + root.slice(13) + stat.name + '\']=\'' +
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

function lib(callback) {
  console.log('going to walk lib');
  var walker = walk.walk('test-project/lib/' , {followLinks: false});
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

var compile = function(callback) {
  console.log('starting to compile');
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
          console.log('Running closure compiler...');
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
