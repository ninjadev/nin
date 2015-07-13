var sock = require('sockjs')
  , chokidar = require('chokidar')
  , fs = require('fs')
  , sg = require('./shadergen')
  ;


function socket(projectPath) {
  console.log('project path:', projectPath);
  var echo = sock.createServer();
  connections = {};

  echo.on('connection', function (conn) {
    connections[conn.id] = conn;
    console.log('connection!');

    conn.send = function(event, data) {
      conn.write(JSON.stringify({
        type: event,
        data: data
      }));
    };

    conn.on('close', function () {
      delete connections[conn.id];
      console.log('lost connection');
    });

    var watcher = chokidar.watch(
      [projectPath + '/src/',
       projectPath + '/res/layers.json',
       projectPath + '/res/camerapaths.json'], {
      ignored: /[\/\\]\./,
      persistent: true,
      ignoreInitial: false
    });


    /* an empty 'add' handler is needed to
     * trigger intial callbacks for all files */
    watcher.on('add', function(){ });

    watcher.on('all', function (event, path) {
      console.log('event!', event, path);
      var pathParts = path.split('/');
      if (event === 'unlink') event = 'delete';
      if (event == 'addDir') {
        return;
      }
      if(pathParts.indexOf('shaders') !== -1) {
        sg.shaderGen(projectPath, function() {
          conn.send(event, {
            path: path.slice(projectPath.length)
          });
        });
      } else {
        console.log('Change in project detected: ' + event + ', ' + path)
        conn.send(event, {
          path: path.slice(projectPath.length)
        });
      }
    });

    conn.on('data', function (message) {
      var event = JSON.parse(message);
      if(event.type == 'set') {
        event = event.data;
        fs.readFile(projectPath + '/res/layers.json', function (err, data) {
          var layers = JSON.parse(data);
          layers[event.id][event.field] = event.value;
          fs.writeFile(projectPath + '/res/layers.json', JSON.stringify(layers, null, '  ') + '\n', function (err) {

          })
        })
      }
    });
  })
  return echo;
}

module.exports = {socket: socket};
