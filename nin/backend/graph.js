var fs = require('fs');
var utils = require('./utils');

function transform(projectPath, transformer, callback) {
  read(projectPath, function (err, graph) {
    if (err) {
      if (callback) {
        callback(err);
      }
      return;
    }

    transformer(graph);

    write(projectPath, graph, function (err) {
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
  fs.writeFile(projectPath + '/res/graph.json', data, function(err) {
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
  fs.readFile(projectPath + '/res/graph.json', function(err, data) {
    if (err) {
      advanceQueue();
      callback(err);
    } else {
      var graph = JSON.parse(data);
      callback(err, graph);
    }
  });
}

module.exports = {transform: transform};
