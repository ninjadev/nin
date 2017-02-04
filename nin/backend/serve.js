let bodyParser = require('body-parser');
let chalk = require('chalk');
let concat = require('concat-files');
let express = require('express');
let fs = require('fs');
let mkdirp = require('mkdirp');
let p = require('path');
let projectSettings = require('./projectSettings');
let readDir = require('readdir');
let socket = require('./socket');
let watch = require('./watch');
const os = require('os');
const ini = require('ini');

const serve = function(
    projectPath,
    frontendPort=8000,
    backendPort=9000) {
  const genPath = p.join(projectPath, 'gen');
  mkdirp.sync(genPath);

  const dasBootSourceDirectoryPath = p.join(__dirname, '../dasBoot');
  const dasBootLibSourceFilePaths = readDir.readSync(
    dasBootSourceDirectoryPath,
    ['lib/*.js'],
    readDir.ABSOLUTE_PATHS
  ).sort();
  let dasBootSourceFilePaths = readDir.readSync(
    dasBootSourceDirectoryPath,
    ['*.js'],
    readDir.ABSOLUTE_PATHS
  ).sort();

  const dasBootDestinationFilePath = p.join(projectPath, 'gen/dasBoot.js');
  concat(dasBootLibSourceFilePaths.concat(dasBootSourceFilePaths),
         dasBootDestinationFilePath, function() {
    /* eslint-disable */
    projectSettings.generate(projectPath);

    var frontend = express();
    frontend.use(express.static(p.join(__dirname, '../frontend/dist')));
    frontend.get('/.ninrc', (req, res) => {
      let content = {};
      const ninrcpath = p.join(os.homedir(), '.ninrc');
      if (fs.existsSync(ninrcpath)) {
        try {
          const rawContent = fs.readFileSync(ninrcpath, 'utf-8');
          content = ini.parse(rawContent);
        } catch (e) {
          console.error('Error while reading .ninrc: ' + e);
        }
      }

      res.send(JSON.stringify(content));
    });
    frontend.listen(frontendPort);

    var eventFromPath = function(data) {
      var path = data.path;
      var filename = p.basename(path);
      var content = fs.readFileSync(p.join(projectPath, path), 'utf-8');

      var event = {
        path: path
      };

      if (filename == 'graph.json') {
        event.type = 'graph';
        event.content = content;
      } else if (path.endsWith('.camera.json')) {
        event.type = 'camera';
        event.path = path;
        event.content = content;
      } else if (path.indexOf('/shaders/') !== -1) {
        event.type = 'shader';
        event.content = data.out;
        event.shadername = p.basename(p.dirname(path));
      } else {
        event.type = 'node';
        event.content = content;
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
      var sortedPaths = watcher.paths.sort(function(a, b) {
        var directoryPrecedence = {'lib': 0, 'src': 1, 'res': 2};
        var directoryAScore = directoryPrecedence[a.slice(0, 3)];
        var directoryBScore = directoryPrecedence[b.slice(0, 3)];

        if(directoryAScore == directoryBScore) {
          return a > b;
        }

        return directoryAScore > directoryBScore;
      });

      for (var i in sortedPaths) {
        conn.send('add', eventFromPath({path: sortedPaths[i]}));
      }
    });

    sock.server.installHandlers(sockets_server, {prefix: '/socket'});
    sockets_server.listen(1337, '0.0.0.0');

    var files = express();
    files.use(function(req, res, next) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers',
                 'Origin, X-Requested-With, Content-Type, Accept');
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
    files.listen(backendPort);

    console.log(chalk.yellow(`Serving nin on http://localhost:${frontendPort}`));
  });
/* eslint-enable*/
};

module.exports = {serve: serve};
