var chalk = require('chalk');
var generate = require('./generate/generate');
var graph = require('./graph');
var sock = require('sockjs');


function socket(projectPath, onConnectionCallback) {
  var server = sock.createServer();
  var connections = {};

  function broadcast(event, data) {
    for (var id in connections) {
      connections[id].send(event, data);
    }
  }

  server.on('connection', function (conn) {
    connections[conn.id] = conn;
    console.log(chalk.magenta('A client has connected.'));

    conn.send = function(event, data) {
      conn.write(JSON.stringify({
        type: event,
        data: data
      }));
    };

    if (onConnectionCallback) {
      onConnectionCallback(conn);
    }

    conn.on('close', function () {
      delete connections[conn.id];
      console.log(chalk.magenta('A client has disconnected.'));
    });

    conn.on('data', function (message) {
      var event = JSON.parse(message);
      switch (event.type) {
        case 'set':
          graph.update(projectPath, event.data.id, event.data.fields, function (err) {
            if (err) {
              console.log(err);
            }
          });
          break;

        case 'generate':
          generate.generate(projectPath, event.data.type, event.data.name);
          break;
      }
    });
  });
  return {server: server, broadcast: broadcast};
}

module.exports = socket;
