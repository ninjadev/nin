var sock = require('sockjs');


var echo = sock.createServer();
connections = {};
echo.on('connection', function (conn) {
  connections[conn.id] = conn;
  conn.on('close', function () {
    delete connections[conn.id];
  });
  conn.on('data', function (message) {
    conn.write(message);
  })
})

module.exports = {socket: echo};
