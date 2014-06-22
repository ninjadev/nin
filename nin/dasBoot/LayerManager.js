/**
 * @constructor
 */
function LayerManager(demo) {
  this.layers = [];
  this.startFrames = {}; 
  this.endFrames = {};
  this.activeLayers = [];
  this.demo = demo;
  this.lastUpdatedActiveLayers = -1;
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
    var relativeFrame = frame - this.activeLayers[i].startFrame;
    this.activeLayers[i].instance && this.activeLayers[i].instance.update(
        frame, relativeFrame);
  }
};

LayerManager.prototype.render = function(renderer, interpolation) {
  for(var i = 0; i < this.activeLayers.length; i++) {
    this.activeLayers[i].instance && this.activeLayers[i].instance.render(renderer, interpolation);
  }
};

LayerManager.prototype.reset = function() {
  this.activeLayers = [];
  this.lastUpdatedActiveLayers = -1;
};

LayerManager.prototype.hardReset = function() {
  this.reset();
  this.layers = [];
  this.startFrames = {};
  this.endFrames = {};
};

LayerManager.prototype.refresh = function(layerName) {
  for(var i = 0;i < this.layers.length; i++) {
    var layer = this.layers[i];  
    if(layer.type == layerName) {
      layer.instance = new window[layerName](layer);
    }
  }
  this.rebuildEffectComposer();
};

LayerManager.prototype.jumpToFrame = function(frame) {
  this.reset();
  for(var i = 0; i < frame; i++) {
    this.updateActiveLayersList(i);
  }
  this.rebuildEffectComposer();
  this.update(frame);
};

LayerManager.prototype.updateActiveLayersList = function(frame, forceUpdate) {
  if(this.lastUpdatedActiveLayers == frame) {
    return;
  }
  this.lastUpdatedActiveLayers = frame;
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
      Array.removeObject(this.activeLayers, layer);
      layer.instance.end();
    }
  }
  if(activeLayersChanged || forceUpdate) {
    this.activeLayers.sort(function(a, b) {
      return a.position - b.position;
    });

    this.rebuildEffectComposer();
  }
};

LayerManager.prototype.rebuildEffectComposer = function() {
  this.demo.rebuildEffectComposer(this.activeLayers.map(function(el) {
    return el.instance.getEffectComposerPass();
  }));
};
