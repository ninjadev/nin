var compress = require('./compress').compress;
var exec = require('child_process').exec;
var fs = require('fs');
var mkdirp = require('mkdirp');
var p = require('path');
var projectSettings = require('./projectSettings');
var rmdir = require('rimraf');
var shaderGen = require('./shadergen').shaderGen;
var walk = require('walk');


function moveCursorToColumn(col) {
  return '\033[' + col + 'G';
}


function res(projectPath, callback) {
  var walker = walk.walk(projectPath + '/res/' , {followLinks: false});
  var files = [];
  process.stdout.write('Collecting files from res/\n');
  walker.on('file', function(root, stat, next) {

    /* hacks to ensure slashes in path are correct.
     * TODO: is there a bug in walker that causes
     * these things to happen?  */
    root += '/'
    root = root.replace(/\/\//g, '/');

    var file = fs.readFileSync(root + stat.name);
    process.stdout.write('Assimilating res/' + stat.name);
    files.push('FILES[\'' + root.slice(projectPath.length + 1) + stat.name + '\']=\'' +
               file.toString('base64') + '\'');
    process.stdout.write(moveCursorToColumn(72) + '[OK]\n');
    next();
  });
  walker.on('end', function(){
    process.stdout.write('Merging assimilated files');
    callback('FILES={};' + files.join(';') + ';');
    process.stdout.write(moveCursorToColumn(72) + '[OK]\n');
  });
}

var compile = function(projectPath, options) {
  function collect(data) {
    function writeDemoToFile(data, filename) {
      var binPath = p.join(projectPath, '/bin/');
      mkdirp(binPath, function() {
        fs.writeFileSync(projectPath + '/bin/' + filename, data);
      });
    }
    if(options.pngCompress) {
      compress(projectPath, data, function(data) {
        writeDemoToFile(data, 'demo.png.html');
        process.stdout.write('Successfully compiled demo.png.html!\n');
      });
    } else {
      var customHtml = '';
      try {
        customHtml = fs.readFileSync(projectPath + '/index.html', {encoding: 'utf8'});
      } catch(e) {
        customHtml = fs.readFileSync(__dirname + '/index.html', {encoding: 'utf8'});
      }
      var html =
        customHtml +
        '<script>' +
        'GU=1;' + /* hack to make sure GU exisits from the get-go */
        'BEAN=0;' +
        'BEAT=false;' +
        'FRAME_FOR_BEAN=function placeholder(){};' +
        'BEAN_FOR_FRAME=function placeholder(){};' +
         data +
        'var layers = JSON.parse(atob(FILES["res/layers.json"]));' +
        'var camerapaths = JSON.parse(atob(FILES["res/camerapaths.json"]));' +
        'demo=bootstrap({layers:layers, camerapaths:camerapaths, onprogress: ONPROGRESS, oncomplete: ONCOMPLETE});' +
        '</script>';
      writeDemoToFile(html, 'demo.html') +
      process.stdout.write('Successfully compiled demo.html!\n');
    }
  }
  res(projectPath, function(data) {
    var genPath = p.join(projectPath, '/gen/');
    rmdir(genPath, function(error) {
      mkdirp(genPath, function(error) {
        fs.writeFileSync(projectPath + '/gen/files.js', new Buffer(data));
        projectSettings.generate(projectPath);
        shaderGen(projectPath, function() {
          process.stdout.write('Running closure compiler...');
          exec('java -jar -Xmx2048m ' + __dirname + '/compiler.jar -O SIMPLE --language_in ECMASCRIPT5 --logging_level INFO ' + __dirname + '/../dasBoot/lib/*.js ' + __dirname + '/../dasBoot/*.js ' + projectPath + '/lib/*.js ' + projectPath + '/gen/*.js ' + projectPath + '/src/*.js',
            {encoding: 'binary', maxBuffer: 1024 * 1024 * 1024},
            function(error, stdout, stderr) {
              stderr && console.error(stderr);
              process.stdout.write(moveCursorToColumn(72) + '[OK]\n');
              collect(stdout);
            });
        });
      });
    });
  });
};


module.exports = {compile: compile};
