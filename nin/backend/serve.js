const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const ini = require('ini');
const mkdirp = require('mkdirp');
const os = require('os');
const p = require('path');
const projectSettings = require('./projectSettings');
const socket = require('./socket');
const utils = require('./utils');
const watch = require('./watch');
const dasbootGen = require('./dasbootgen');

const serve = async function(
    projectPath,
    frontendPort=8000,
    backendPort=9000) {
  const genPath = p.join(projectPath, 'gen');
  mkdirp.sync(genPath);

  await dasbootGen(projectPath);
  /* eslint-disable */
  projectSettings.generate(projectPath);

  const frontend = express();
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

  const eventFromPath = function(data) {
    const path = data.path;
    const filename = p.basename(path);
    const content = fs.readFileSync(p.join(projectPath, path), 'utf-8');

    const event = {
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

  const watcher = watch(projectPath, function(event, data) {
    if (event !== 'add' && event !== 'change') {
      return;
    }

    sock.broadcast(event, eventFromPath(data));
  });

  const sockets = express();
  const sockets_server = require('http').createServer(sockets);
  const sock = socket(projectPath, function(conn) {
    const directoryPrecedence = {'lib': 0, 'src': 1, 'res': 2};
    const sortedPaths = watcher.paths.sort(function(a, b) {
      const directoryAScore = directoryPrecedence[a.slice(0, 3)];
      const directoryBScore = directoryPrecedence[b.slice(0, 3)];

      if(directoryAScore == directoryBScore) {
        if (a > b) {
          return 1;
        } else if (a < b) {
          return -1;
        } else {
          return 0;
        }
      }

      return directoryAScore - directoryBScore;
    });

    for (const i in sortedPaths) {
      conn.send('add', eventFromPath({path: sortedPaths[i]}));
    }
  });

  sock.server.installHandlers(sockets_server, {prefix: '/socket'});
  sockets_server.listen(1337, '0.0.0.0');

  const files = express();
  files.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers',
               'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });
  files.use(express.static(projectPath));
  files.use(bodyParser.json({limit: '50mb'}));
  files.post('/', function(req, res){
    let filename = '' + req.body.frame;
    while(filename.length < 7) {
      filename = '0' + filename;
    }
    filename += '.png';
    console.log(filename);
    const buffer = new Buffer(req.body.image.slice(22), 'base64');
    fs.writeFile(projectPath + '/bin/render/' + filename, buffer, err => {
      if (err) {
        console.error(err);
      }
    });
    res.writeHead(200);
    res.end('OK');
  });
  mkdirp.sync(projectPath + '/bin/render/');
  files.listen(backendPort);

  const pm = utils.getProjectMetadata(projectPath);
  const {name, version} = utils.getNinMetadata(projectPath);

  console.log(`${name}@${version} serving ${pm.projectSettings.title} on port 8000`);
/* eslint-enable*/
};

module.exports = {serve: serve};
