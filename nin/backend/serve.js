var express = require('express');
var fs = require('fs');
var socket = require('./socket').socket;
var sg = require('./shadergen');
var p = require('path');
var mkdirp = require('mkdirp');
var readDir = require('readdir');
var concat = require('concat-files');
var bodyParser = require('body-parser');

var serve = function(projectPath, shouldRunHeadlessly) {

  var genPath = p.join(projectPath, '/gen/');
  mkdirp.sync(genPath);

  var dasBootSourceDirectoryPath = p.join(__dirname, '/../dasBoot/');
  var dasBootSourceFilePaths = readDir.readSync(
    dasBootSourceDirectoryPath,
    ['**.js'],
    readDir.ABSOLUTE_PATHS
  );
  var dasBootDestinationFilePath = p.join(projectPath, '/gen/dasBoot.js');
  concat(dasBootSourceFilePaths, dasBootDestinationFilePath, function() {
    console.log(__dirname);
    if(!shouldRunHeadlessly) {
      var frontend = express();
      frontend.use(express.static(__dirname + '/../frontend/dist/'));
      frontend.listen(8000);
    }

    var sockets = express();
    var sockets_server = require('http').createServer(sockets);
    var sock = socket(projectPath);
    sock.installHandlers(sockets_server, {prefix: '/socket'});
    sockets_server.listen(1337, '0.0.0.0');

    sg.shaderGen(projectPath, function() {});

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
