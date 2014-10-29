var sock = require('sockjs')
  , chokidar = require('chokidar')
  , fs = require('fs')
  , sg = require('./shadergen')
  ;


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
    ['test-project/src/', 'test-project/res/layers.json', 'test-project/res/camerapaths.json'], {
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
    if(pathParts.indexOf('shaders') !== -1) {
      sg.shaderGen(function() {
      });
    } else {
      if(event == 'addDir') {
        return;
      }
      console.log('Change in project detected: ' + event + ', ' + path)
      conn.send(event, {
        path: path
      });
    }
  });

  conn.on('data', function (message) {
    // expecting a message of layerid, the field, and the value
    // if you do something else, you are a horrible person.

    //console.log(message);
    var event = JSON.parse(message);
    if(event.type == 'render-frame') {
      var filename = '' + event.frame;
      while(filename.length < 7) {
        filename = '0' + filename;
      }
      filename += '.png';
      console.log(filename, event.image.slice(0, 22));
      var buffer = new Buffer(event.image.slice(22), 'base64');
      fs.writeFileSync('test-project/bin/render/' + filename, buffer);
      conn.send('frame-received', {});
    }
    if(event.type == 'set') {
      event = event.data;
      fs.readFile('test-project/res/layers.json', function (err, data) {
        var layers = JSON.parse(data);
        layers[event.id][event.field] = event.value;
        fs.writeFile('test-project/res/layers.json', JSON.stringify(layers, null, '  '), function (err) {

        })
      })
    }
  });
})

module.exports = {socket: echo};
