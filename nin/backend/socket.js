var sock = require('sockjs')
  , layers = require('./layers')
  , generate = require('./generate/generate')
  ;

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
      switch (event.type) {
        case 'set':
          var data = {};
          data[event.data.field] = event.data.value;
          layers.update(projectPath, event.data.id, data, function (err) {
            if (err) {
              console.log(err);
            }
          });
          break;

        case 'generate':
          generate.generate(event.data.type, event.data.name);
          break;
      }
    });
  });
  return {server: server, broadcast: broadcast};
}

module.exports = socket;
