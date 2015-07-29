var fs = require('fs');

function FileManager(filePath) {
  var that = this;
  that.filePath = filePath;

  that.operationQueue = [];
  that.activeOperation = null;

  function advanceQueue() {
    that.activeOperation = that.operationQueue.shift() || null;
    if (that.activeOperation) {
      _read.apply(that, that.activeOperation);
    }
  }

  function _read(openerCallback, userCallback) {
    fs.readFile(that.filePath, function(err, file) {
      if (err) {
        advanceQueue();
        if (typeof userCallback === 'function') {
          userCallback(err);
        }
      } else {
        var data = JSON.parse(file);
        openerCallback(data, that.write);
      }
    });
  }

  that.read = function read(openerCallback, userCallback) {
    that.operationQueue.push([openerCallback, userCallback]);
    if (that.activeOperation === null) {
      advanceQueue();
    }
  };

  that.write = function write(data) {
    var file = JSON.stringify(data, null, 2) + '\n';
    fs.writeFile(that.filePath, file, function(err) {
      var userCallback = that.activeOperation[1];
      advanceQueue();
      if (typeof userCallback === 'function') {
        userCallback(err);
      }
    });
  };
}

module.exports = FileManager;
