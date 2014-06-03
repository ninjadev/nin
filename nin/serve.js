var exec = require('child_process').exec;
var express = require('express');
var fs = require('fs');
var socket = require('./socket').socket;

var serve = function () {
  exec('mkdir -p test-project/gen/ && find dasBoot/ -type f -name "*.js" | sort |xargs cat > test-project/gen/dasBoot.js',

       function(error, stdout, stderr){

    var frontend = express();
    frontend.use(express.static(__dirname + '/frontend'));
    frontend.listen(8000);

    var sockets = express();
    var sockets_server = require('http').createServer(sockets);
    socket.installHandlers(sockets_server, {prefix: '/socket'});
    sockets_server.listen(1337, '0.0.0.0');

    var files = express();
    files.use(function(req, res, next) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      return next();
    });
    files.use(express.static(__dirname + '/test-project'));
    files.listen(9999);

    console.log('serving nin on http://localhost:8000');
  });
}

module.exports = {serve: serve};
