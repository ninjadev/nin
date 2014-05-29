var sock = require('sockjs')
  , chokidar = require('chokidar')
  , jf = require('jsonfile');

var watcher = chokidar.watch('test-project/src', {ignored: /[\/\\]\./, persistent: true});


var echo = sock.createServer();
connections = {};

echo.on('connection', function (conn) {
  connections[conn.id] = conn;

  conn.on('close', function () {
    delete connections[conn.id];
  });

  watcher.on('all', function (event, path) {
    if (event === 'unlink') event = 'delete';
    console.log('Change in project detected: ' + event + ', ' + path)
    conn.write(event + ' ' + path);
  });

  conn.on('data', function (message) {
    // expecting a message of layerid, the field, and the value
    // if you do something else, you are a horrible person.
    message = message.split(' ');
    var id = message[0], field = message[1], value = message[2];
    jf.readFile('test-project/res/layers.json', function (err, layerlist) {
      layerlist[id][field] = value;
      jf.writeFile('test-project/res/layers.json', layerlist, function (err) {
        if (err) console.log(err);
        conn.write('layers.json updated')
      })
    })
  });
})

module.exports = {socket: echo};
