var fs = require('fs')
  , utils = require('./utils')
  ;

function add(projectPath, layer, callback) {
  read(projectPath, function (err, layers) {
    if (err) {
      if (callback) {
        callback(err);
      }
      return;
    }
    var defaultLayer = {
      type: '',
      displayName: '',
      startFrame: 0,
      endFrame: 1000,
      color: 'red',
      config: {}
    };
    layers.unshift(utils.mergeOptions(layer, defaultLayer));
    write(projectPath, layers, function (err) {
      if (callback) {
        callback(err);
      }
    });
  });
}

function update(projectPath, layerId, layer, callback) {
  read(projectPath, function (err, layers) {
    if (err) {
      if (callback) {
        callback(err);
      }
      return;
    }
    for (var key in layer) {
      layers[layerId][key] = layer[key];
    }
    write(projectPath, layers, function (err) {
      if (callback) {
        callback(err);
      }
    });
  });
}

var operationQueue = [];
var activeOperation = null;

function read(projectPath, callback) {
  operationQueue.push([projectPath, callback]);
  if (activeOperation === null) {
    advanceQueue();
  }
}

function write(projectPath, layers, callback) {
  var data = JSON.stringify(layers, null, 2) + '\n';
  data = data.replace(/[\u007F-\uFFFF]/g, function(chr) {
    return '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).substr(-4);
  });
  fs.writeFile(projectPath + '/res/layers.json', data, function(err) {
    advanceQueue();
    callback(err);
  });
}

function advanceQueue() {
  activeOperation = operationQueue.shift() || null;
  if (activeOperation) {
    _read.apply(this, activeOperation);
  }
}

function _read(projectPath, callback) {
  fs.readFile(projectPath + '/res/layers.json', function(err, data) {
    if (err) {
      advanceQueue();
      callback(err);
    } else {
      var layers = JSON.parse(data);
      callback(err, layers);
    }
  });
}

module.exports = {add: add, update: update};
