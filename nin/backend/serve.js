const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs-promise');
const ini = require('ini');
const os = require('os');
const p = require('path');
const projectSettings = require('./projectSettings');
const socket = require('./socket');
const utils = require('./utils');
const watch = require('./watch');
const dasbootGen = require('./dasbootgen');
const fontGen = require('./fontgen');

const serve = async function(
    projectPath,
    frontendPort=8000) {
  const genPath = p.join(projectPath, 'gen');
  await fs.emptyDir(genPath);
  await Promise.all([
    fontGen(projectPath),
    dasbootGen(projectPath),
  ]);
  projectSettings.generate(projectPath);

  const frontend = express();
  const server = require('http').createServer(frontend);
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

  const eventFromPath = function(data) {
    const path = data.path;
    const filename = p.basename(path);
    const content = fs.readFileSync(p.join(projectPath, path), 'utf-8');

    const event = {
      path: path.replace(path.sep, '/'),
    };

    if (filename == 'graph.json') {
      event.name = 'graph';
      event.type = 'graph';
      event.content = content;
    } else if (path.endsWith('.camera.json')) {
      event.type = 'camera';
      event.content = content;
    } else if (path.split(p.sep).includes('shaders')) {
      event.type = 'shader';
      event.content = data.out;
      event.name = p.basename(p.dirname(path));
    } else {
      event.type = 'node';
      event.content = content;
      event.name = p.parse(path).name;
    }

    return event;
  };

  const watcher = watch(projectPath, function(event, data) {
    if (!['add', 'change'].includes(event)) {
      return;
    }

    sock.broadcast(event, eventFromPath(data));
  });

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

    for (const path of sortedPaths) {
      conn.send('add', eventFromPath({path}));
    }
  });

  sock.server.installHandlers(server, {prefix: '/socket'});

  frontend.use('/project/', express.static(projectPath));
  frontend.use(bodyParser.json({limit: '50mb'}));
  frontend.post('/render', function(req, res){
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
  await fs.ensureDir(p.join(projectPath, 'bin', 'render'));

  server.listen(frontendPort, '0.0.0.0');

  const pm = utils.getProjectMetadata(projectPath);
  const {name, version} = utils.getNinMetadata(projectPath);

  console.log(`${name}@${version} serving ${pm.projectSettings.title} on port ${frontendPort}`);
};

module.exports = {serve: serve};
