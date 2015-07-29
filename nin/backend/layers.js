var FileManager = require('./fileManager');
var utils = require('./utils');

function getFileManager(projectPath) {
  return new FileManager(projectPath + '/res/layers.json');
}

function add(projectPath, layer, callback) {
  var fileManager = getFileManager(projectPath);
  fileManager.read(function (layers) {
    var defaultLayer = {
      type: '',
      displayName: '',
      startFrame: 0,
      endFrame: 1000,
      color: 'red',
      config: {}
    };
    layers.unshift(utils.mergeOptions(layer, defaultLayer));
    fileManager.write(layers);
  }, callback);
}

function update(projectPath, layerId, layer, callback) {
  var fileManager = getFileManager(projectPath);
  fileManager.read(function (layers) {
    for (var key in layer) {
      layers[layerId][key] = layer[key];
    }
    fileManager.write(layers);
  }, callback);
}

module.exports = {add: add, update: update};
