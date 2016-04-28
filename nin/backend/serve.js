var bodyParser = require('body-parser');
var concat = require('concat-files');
var express = require('express');
var fs = require('fs');
var mkdirp = require('mkdirp');
var p = require('path');
var projectSettings = require('./projectSettings');
var readDir = require('readdir');
var socket = require('./socket');
var watch = require('./watch');


var serve = function(projectPath, shouldRunHeadlessly) {

  var genPath = p.join(projectPath, '/gen/');
  mkdirp.sync(genPath);

  var dasBootSourceDirectoryPath = p.join(__dirname, '/../dasBoot/');

  var dasBootLibSourceFilePaths = readDir.readSync(
    dasBootSourceDirectoryPath,
    ['lib/*.js'],
    readDir.ABSOLUTE_PATHS
  ).sort();
  var dasBootSourceFilePaths = readDir.readSync(
    dasBootSourceDirectoryPath,
    ['*.js'],
    readDir.ABSOLUTE_PATHS
  ).sort();

  var dasBootDestinationFilePath = p.join(projectPath, '/gen/dasBoot.js');
  concat(dasBootLibSourceFilePaths.concat(dasBootSourceFilePaths),
         dasBootDestinationFilePath, function() {
    projectSettings.generate(projectPath);

    console.log(__dirname);
    if(!shouldRunHeadlessly) {
      var frontend = express();
      frontend.use(express.static(__dirname + '/../frontend/dist/'));
      frontend.listen(8000);
    }

    var findShaderDependencies = function(content) {
      var regex = /\bSHADERS\.(\w+)\b/g;
      var shaderNames = [];
      var matches = content.match(regex) || [];
      matches.forEach(function(match) {
        var shaderName = match.split('.')[1];
        if (shaderNames.indexOf(shaderName) === -1) {
          shaderNames.push(shaderName);
        }
      });
      return shaderNames;
    };

    var eventFromPath = function(data) {
      var path = data.path,
          filename = p.basename(path),
          filenameWithoutExtension = filename.split('.')[0],
          content = fs.readFileSync(path, 'utf-8');

      var event = {};

      if (filename == 'layers.json' ||
            filename == 'camerapaths.json') {
        event.type = filenameWithoutExtension;
        event.content = content;
      } else if (path.indexOf('/shaders/') !== -1) {
        event.type = 'shader';
        event.content = data.out;
        event.shadername = p.basename(p.dirname(path));
      } else {
        event.type = 'layer';
        event.content = content;
        event.layername = filenameWithoutExtension;
        event.shaderDependencies = findShaderDependencies(content);
      }

      return event;
    };

    var watcher = watch(projectPath, function(event, data) {
      if (event !== 'add' && event !== 'change') {
        return;
      }

      sock.broadcast(event, eventFromPath(data));
    });

    var sockets = express();
    var sockets_server = require('http').createServer(sockets);
    var sock = socket(projectPath, function(conn) {
      var sortedPaths = watcher.paths.sort();
      for (var i in sortedPaths) {
        conn.send('add', eventFromPath({path: sortedPaths[i]}));
      }
    });

    sock.server.installHandlers(sockets_server, {prefix: '/socket'});
    sockets_server.listen(1337, '0.0.0.0');

    var files = express();
    files.use(function(req, res, next) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers",
                 "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });
    files.use(express.static(projectPath));
    files.use(bodyParser.json({limit: '50mb'}));
    files.post('/', function(req, res){
      var filename = '' + req.body.frame;
      while(filename.length < 7) {
        filename = '0' + filename;
      }
      filename += '.png';
      console.log(filename);
      var buffer = new Buffer(req.body.image.slice(22), 'base64');
      fs.writeFile(projectPath + '/bin/render/' + filename, buffer);
      res.writeHead(200);
      res.end('OK');
    });
    mkdirp.sync(projectPath + '/bin/render/');
    files.listen(9000);

    if(shouldRunHeadlessly) {
      console.log('running nin headlessly');
    } else {
      console.log('serving nin on http://localhost:8000');
    }

  });
};

module.exports = {serve: serve};
