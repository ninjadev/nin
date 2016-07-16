var chalk = require('chalk');
var compress = require('./compress').compress;
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
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

function renderOK() {
    console.log(moveCursorToColumn(72) +
                chalk.grey('[') + chalk.green('OK') + chalk.grey(']'));
}

function renderWarn() {
    console.log(moveCursorToColumn(70) +
                chalk.grey('[') + chalk.yellow('WARN') + chalk.grey(']'));
}

function renderError() {
    console.log(moveCursorToColumn(69) +
                chalk.grey('[') + chalk.red('ERROR') + chalk.grey(']'));
}

function res(projectPath, callback) {
  var walker = walk.walk(projectPath + '/res/' , {followLinks: false});
  var files = [];
  console.log(chalk.yellow('\nCollecting files from res/'));
  walker.on('file', function(root, stat, next) {

    /* hacks to ensure slashes in path are correct.
     * TODO: is there a bug in walker that causes
     * these things to happen?  */
    root += '/'
    root = root.replace(/\/\//g, '/');

    var file = fs.readFileSync(root + stat.name);
    process.stdout.write('- Assimilating ' + chalk.grey('res/') + chalk.magenta(stat.name));
    files.push('FILES[\'' + root.slice(projectPath.length + 1) + stat.name + '\']=\'' +
               file.toString('base64') + '\'');
    renderOK();
    next();
  });
  walker.on('end', function(){
    process.stdout.write(chalk.yellow('\nMerging assimilated files'));
    callback('FILES={};' + files.join(';') + ';');
    renderOK();
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

    var settings = projectSettings.load(projectPath);
    var metadata = [
      ['Title', settings.title],
      ['Author', settings.authors.join(', ')],
      ['Creation time', '' + new Date()],
      ['Software', 'NIN'],
      ['Description',
        "Git revision: " + execSync('git rev-parse HEAD') +
        'Git origin: ' + execSync('git config --get remote.origin.url')]
    ];

    if(options.pngCompress) {
      process.stdout.write(chalk.yellow('\nCompressing demo to .png.html'));
      compress(projectPath, data, metadata, function(data) {
        renderOK();
        writeDemoToFile(data, 'demo.png.html');
        console.log(chalk.white('\n★ ---------------------------------------- ★'));
        console.log(chalk.white('| ') +
                    chalk.green('Successfully compiled ') +
                    chalk.grey('bin/') +
                    chalk.green('demo.png.html!') +
                    chalk.white(' |'));
        console.log(chalk.white('★ ---------------------------------------- ★\n'));
      });
    } else {
      var customHtml = '';
      try {
        customHtml = fs.readFileSync(projectPath + '/index.html', {encoding: 'utf8'});
      } catch(e) {
        customHtml = fs.readFileSync(__dirname + '/index.html', {encoding: 'utf8'});
      }

      var parsedMetadata = metadata.map(function(data) {
        return '<!-- ' + data[0] + ': ' + data[1] + ' -->';
      }).join('\n') + '\n';

      var html =
        parsedMetadata +
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
          process.stdout.write(chalk.yellow('\nRunning closure compiler'));
          exec('java -jar -Xmx2048m ' + __dirname + '/compiler.jar -O SIMPLE --language_in ECMASCRIPT6 --language_out=ES5 --logging_level INFO ' + __dirname + '/../dasBoot/lib/*.js ' + __dirname + '/../dasBoot/*.js ' + projectPath + '/lib/*.js ' + projectPath + '/gen/*.js ' + projectPath + '/src/*.js',
            {encoding: 'binary', maxBuffer: 1024 * 1024 * 1024},
            function(error, stdout, stderr) {
              if(error) {
                renderError();
                console.error(error);
                process.exit(1);
              } else if(stderr) {
                renderWarn();
                console.error(stderr);
              } else {
                renderOK();
              }
              collect(stdout);
            });
        });
      });
    });
  });
};


module.exports = {compile: compile};
