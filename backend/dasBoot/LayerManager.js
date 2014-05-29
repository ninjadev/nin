/**
 * @constructor
 */
function LayerManager(layers) {
  this.layers = layers; 
  this.startFrames = {}; 
  this.endFrames = {};
  this.activeLayers = [];

  for(var i = 0; i < this.layers.length; i++) {
    var layer = this.layers[i];

    if(!this.startFrames[layer.startFrame]){
      this.startFrames[layer.startFrame] = [];
    }
    this.startFrames[layer.startFrame].push(layer);

    if(!this.endFrames[layer.endFrame]){
      this.endFrames[layer.endFrame] = [];
    }
    this.endFrames[layer.endFrame].push(layer);
  }
}

LayerManager.prototype.initialize = function() {
  for(var i = 0; i < this.layers.length; i++) {
    this.layers[i].instance = new window[this.layers[i].type](this.layers[i]);
  }
};

LayerManager.prototype.update = function(frame) {
  this.updateActiveLayersList(frame);
  for(var i = 0; i < this.activeLayers.length; i++) {
    this.activeLayers[i].instance.update(frame);
  }
};

LayerManager.prototype.render = function(renderer, interpolation) {
  for(var i = 0; i < this.activeLayers.length; i++) {
    this.activeLayers[i].instance.render(renderer, interpolation);
  }
};

LayerManager.prototype.reset = function() {
  this.activeLayers = [];
  for(var i = 0; i < this.layers.length; i++){
    this.layers[i].instance.end();
  }
};

LayerManager.prototype.skipToFrame = function(frame) {
  this.reset();
  for(var i = 0; i < frame; i++) {
    this.updateActiveLayersList(frame);
  }
};

LayerManager.prototype.updateActiveLayersList = function(frame) {
  var activeLayersChanged = false;
  if(frame in this.startFrames) {
    activeLayersChanged = true;
    for(var i = 0; i < this.startFrames[frame].length; i++) {
      var layer = this.startFrames[frame][i];
      this.activeLayers.push(layer);
      layer.instance.start();
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
