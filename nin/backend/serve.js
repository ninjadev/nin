var exec = require('child_process').exec;
var express = require('express');
var fs = require('fs');
var socket = require('./socket').socket;
var sg = require('./shadergen');

var serve = function(projectPath) {
  exec('mkdir -p ' + projectPath + '/gen/ && ' +
       'find ' + __dirname + '/../dasBoot/ -type f -name "*.js" | ' +
       ' sort | xargs cat > ' + projectPath + '/gen/dasBoot.js',
       function(error, stdout, stderr){

         console.log(__dirname);
    var frontend = express();
    frontend.use(express.static(__dirname + '/../frontend/dist/'));
    frontend.listen(8000);

    var sockets = express();
    var sockets_server = require('http').createServer(sockets);
    var sock = socket(projectPath);
    sock.installHandlers(sockets_server, {prefix: '/socket'});
    sockets_server.listen(1337, '0.0.0.0');

    var files = express();
    files.use(express.static(projectPath));
    files.use(function(req, res, next) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Origin", "*");
      next();
    });
    files.listen(9000);

    console.log('serving nin on http://localhost:8000');
  });
}

module.exports = {serve: serve};
