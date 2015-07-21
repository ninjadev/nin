var sock = require('sockjs')
  , fs = require('fs')
  ;


function socket(projectPath, onConnectionCallback) {
  var server = sock.createServer();
  connections = {};

  function broadcast(event, data) {
    for (var id in connections) {
      connections[id].send(event, data);
    }
  }

  server.on('connection', function (conn) {
    connections[conn.id] = conn;
    console.log('connection!');

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
      console.log('lost connection');
    });

    conn.on('data', function (message) {
      var event = JSON.parse(message);
      if(event.type == 'set') {
        event = event.data;
        fs.readFile(projectPath + '/res/layers.json', function (err, data) {
          var layers = JSON.parse(data);
          layers[event.id][event.field] = event.value;
          fs.writeFile(projectPath + '/res/layers.json', JSON.stringify(layers, null, '  ') + '\n', function (err) {

          });
        });
      }
    });
  });
  return {server: server, broadcast: broadcast};
}

module.exports = socket;
