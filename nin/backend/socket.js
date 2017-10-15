const chalk = require('chalk');
const generate = require('./generate/generate');
const graph = require('./graph');
const sock = require('sockjs');


function socket(projectPath, onConnectionCallback) {
  const server = sock.createServer();
  let connections = {};

  function broadcast(event, data) {
    for (const id in connections) {
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
      let event = JSON.parse(message);
      switch (event.type) {
        case 'graph-disconnect':
          graph.transform(projectPath, g => {
            const index = g.findIndex(nodeInfo => nodeInfo.id === event.data.toNode);
            delete g[index].connected[event.data.toInput];
          });
          break;

        case 'graph-connect':
          graph.transform(projectPath, g => {
            const index = g.findIndex(nodeInfo => nodeInfo.id === event.data.toNode);
            g[index].connected[event.data.toInput] = event.data.fromNode + '.' + event.data.fromOutput;
          });
          break;

        case 'set':
          // TODO: Untested, nothing uses this yet
          graph.transform(projectPath, function(g) {
            const index = g.findIndex(nodeInfo => nodeInfo.id == event.data.id);
            for (const key in event.data.fields) {
              g[index][key] = event.data.fields[key];
            }
          },
            function(err) {
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
