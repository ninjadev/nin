var FileManager = require('./fileManager');
var utils = require('./utils');

function CameraPathManager(projectPath) {
  this.fileManager = new FileManager(projectPath + '/res/camerapaths.json');
}

CameraPathManager.prototype.addForLayer = function addForLayer(layerType, callback) {
  this.fileManager.read(function (cameraPaths, write) {
    var defaultPath = {
      position: [],
      lookAt: []
    };
    cameraPaths[layerType] = defaultPath;
    write(cameraPaths);
  }, callback);
};

CameraPathManager.prototype.addPathType = function addForLayer(layerType, pathType, callback) {
  this.fileManager.read(function (cameraPaths, write) {
    cameraPaths[layerType][pathType] = [];
    write(cameraPaths);
  }, callback);
};

CameraPathManager.prototype.addPath = function update(layerType, pathType, data, callback) {
  this.fileManager.read(function (cameraPaths, write) {
    var currentPath = cameraPaths[layerType][pathType];
    currentPath.push(utils.mergeOptions(data, currentPath));
    currentPath.sort(function(a, b) {
      return a.startFrame - b.startFrame;
    });
    write(cameraPaths);
  }, callback);
};

CameraPathManager.prototype.updatePath = function update(layerType, pathType, index, data, callback) {
  this.fileManager.read(function (cameraPaths, write) {
    var currentPath = cameraPaths[layerType][pathType][index];
    currentPath = utils.mergeOptions(data, currentPath);
    write(cameraPaths);
  }, callback);
};

module.exports = CameraPathManager;
