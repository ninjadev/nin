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

LayerManager.prototype.resize = function() {
  for(var i = 0; i < this.layers.length; i++) {
    var layer = this.layers[i];
    layer.instance && layer.instance.resize && layer.instance.resize();
  }
};

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

  var that = this;
  (function() {
    if(layer.type in window) {
      if (!that.checkDependencies(layer)) {
        return setTimeout(arguments.callee, 100);
      }
      layer.instance = new window[layer.type](layer);
      Loader.start(function() {}, function() {});
      that.rebuildEffectComposer();
    } else {
      setTimeout(arguments.callee, 100);
    }
  })();
}

LayerManager.prototype.update = function(frame) {
  this.updateActiveLayersList(frame);
  for(var i = 0; i < this.activeLayers.length; i++) {
    var layer = this.activeLayers[i],
        li = layer.instance,
        relativeFrame = frame - layer.startFrame;

    if (li) {
      if(layer.automationClips) {
        for(var key in layer.automationClips) {
          var automationClip = layer.automationClips[key];
          for(var j = 1; j < automationClip.length; j++) {
            var keyframe = automationClip[j];
            if(keyframe.relativeFrame >= relativeFrame) {
              var from = automationClip[j - 1];
              var to = keyframe;
              break;
            }
          }
          if(from) {
            li[key] = window[to.type](from.value, to.value,
                                      (relativeFrame - from.relativeFrame) /
                                      (to.relativeFrame - from.relativeFrame));
          } else if(to) {
            li[key] = to.value;
          }
        }
      }
      li.update(frame, relativeFrame);
    }
  }
};

LayerManager.prototype.render = function(renderer, interpolation) {
  for(var i = 0; i < this.activeLayers.length; i++) {
    if (this.activeLayers[i].instance && this.activeLayers[i].instance.render) {
      this.activeLayers[i].instance.render(renderer, interpolation);
    }
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

LayerManager.prototype.refresh = function(className) {
  for(var i = 0;i < this.layers.length; i++) {
    var layer = this.layers[i];
    if(layer.type == className || (layer.dependencies && layer.dependencies.indexOf(className) != -1)) {
      if (layer.type in window && this.checkDependencies(layer)) {
        layer.instance = new window[layer.type](layer);
      }
    }
  }
  this.rebuildEffectComposer();
};

LayerManager.prototype.jumpToFrame = function(frame) {
  this.reset();
  for(var i = 0; i <= frame; i++) {
    this.updateActiveLayersList(i);
  }
  this.rebuildEffectComposer();
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
      layer.instance && layer.instance.start && layer.instance.start();
    }
  }
  if(frame in this.endFrames) {
    activeLayersChanged = true;
    for(var i = 0; i < this.endFrames[frame].length; i++) {
      var layer = this.endFrames[frame][i];
      Array.removeObject(this.activeLayers, layer);
      layer.instance.end && layer.instance.end();
    }
  }
  if(activeLayersChanged || forceUpdate) {
    this.activeLayers.sort(function(a, b) {
      return a.position - b.position;
    });

    this.rebuildEffectComposer();
  }
};

LayerManager.prototype.showCameraPathVisualizations = function(shouldShow) {
  for(var i = 0; i < this.layers.length; i++) {
    var li = this.layers[i].instance;
    if (li && li.cameraController && li.cameraController.position) {
      var pathVisualization = li.cameraController.position
        .getVisualizer()
        .getVisualization();

      var cameraVisualization = li.cameraController
        .getVisualization();

      if (shouldShow) {
        li.scene.add(pathVisualization);
        li.scene.add(cameraVisualization);
      } else {
        li.scene.remove(pathVisualization);
        li.scene.remove(cameraVisualization);
      }
    }
  }
}

LayerManager.prototype.rebuildEffectComposer = function() {
  this.demo.rebuildEffectComposer(this.activeLayers.map(function(el) {
    if (el.instance) {
      return el.instance.getEffectComposerPass();
    }
  }));
};

LayerManager.prototype.checkDependencies = function(layer) {
  if (!layer.dependencies) return true;

  for (var j=0; j < layer.dependencies.length; j++) {
    if (!(layer.dependencies[j] in window)) {
      return false;
    }
  }
  return true;
};
