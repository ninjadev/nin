var sock = require('sockjs')
  , chokidar = require('chokidar');

var watcher = chokidar.watch('test-project/src', {ignored: /[\/\\]\./, persistent: true});


var echo = sock.createServer();
connections = {};

echo.on('connection', function (conn) {
  connections[conn.id] = conn;
  conn.on('close', function () {
    delete connections[conn.id];
  });
  watcher.on('all', function (event, path) {
    conn.write(event, path);
  })
})

module.exports = {socket: echo};
