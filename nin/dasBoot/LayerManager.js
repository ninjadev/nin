/**
 * @constructor
 */
function LayerManager() {
  this.layers = [];
  this.startFrames = {}; 
  this.endFrames = {};
  this.activeLayers = [];
}

LayerManager.prototype.loadLayer = function(layer) {

  this.layers.push(layer);

  if(!this.startFrames[layer.startFrame]){
    this.startFrames[layer.startFrame] = [];
  }
  this.startFrames[layer.startFrame].push(layer);

  if(!this.endFrames[layer.endFrame]){
    this.endFrames[layer.endFrame] = [];
  }
  this.endFrames[layer.endFrame].push(layer);

  (function() {
    if(layer.type in window) {
      layer.instance = new window[layer.type](layer);
    } else {
      setTimeout(arguments.callee, 100);
    }
  })();
}

LayerManager.prototype.update = function(frame) {
  this.updateActiveLayersList(frame);
  for(var i = 0; i < this.activeLayers.length; i++) {
    this.activeLayers[i].instance && this.activeLayers[i].instance.update(frame);
  }
};

LayerManager.prototype.render = function(renderer, interpolation) {
  for(var i = 0; i < this.activeLayers.length; i++) {
    this.activeLayers[i].instance && this.activeLayers[i].instance.render(renderer, interpolation);
  }
};

LayerManager.prototype.reset = function() {
  this.activeLayers = [];
  for(var i = 0; i < this.layers.length; i++){
    this.layers[i].instance.end();
  }
};

LayerManager.prototype.refresh = function(layerName) {
  for(var i = 0;i < this.layers.length; i++) {
    var layer = this.layers[i];  
    if(layer.type == layerName) {
      layer.instance = new window[layerName](layer);
    }
  }
};

LayerManager.prototype.jumpToFrame = function(frame) {
  this.reset();
  for(var i = 0; i < frame; i++) {
    this.updateActiveLayersList(i);
  }
};

LayerManager.prototype.updateActiveLayersList = function(frame) {
  var activeLayersChanged = false;
  if(frame in this.startFrames) {
    activeLayersChanged = true;
    for(var i = 0; i < this.startFrames[frame].length; i++) {
      var layer = this.startFrames[frame][i];
      this.activeLayers.push(layer);
      layer.instance && layer.instance.start();
    }
  }
  if(frame in this.endFrames) {
    activeLayersChanged = true;
    for(var i = 0; i < this.endFrames[frame].length; i++) {
      var layer = this.endFrames[frame][i];
      this.activeLayers.push(layer);
      layer.instance.end();
    }
  }
  if(activeLayersChanged) {
    this.activeLayers.sort(function(a, b) {
      return a.position - b.position;
    });
  }
};
