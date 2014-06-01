var sock = require('sockjs')
  , chokidar = require('chokidar')
  , jf = require('jsonfile')
  , sg = require('./shadergen')
  ;




var echo = sock.createServer();
connections = {};

echo.on('connection', function (conn) {
  connections[conn.id] = conn;
  console.log('connection!');

  conn.on('close', function () {
    delete connections[conn.id];
    console.log('lost connection');
  });

  var watcher = chokidar.watch('test-project/src/', {
    ignored: /[\/\\]\./,
    persistent: true,
    ignoreInitial: false
  });

  /* an empty 'add' handler is needed to
   * trigger intial callbacks for all files */
  watcher.on('add', function(){});

  watcher.on('all', function (event, path) {
    var pathParts = path.split('/');
    if (event === 'unlink') event = 'delete';
    if(pathParts.indexOf('shaders') !== -1) {
      sg.shaderGen(function() {
        conn.write('shaders!');
      });
    } else {
      console.log('Change in project detected: ' + event + ', ' + path)
      conn.write(event + ' ' + path);
    }
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
