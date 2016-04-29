/**
 * @constructor
 */
function TemplateLayer(layer) {
  this.config = layer.config;
  this.shaderPass = new THREE.ShaderPass(SHADERS.TemplateShader);
}

TemplateLayer.prototype.getEffectComposerPass = function() {
  return this.shaderPass;
};

TemplateLayer.prototype.start = function() {
};

TemplateLayer.prototype.end = function() {
};

TemplateLayer.prototype.update = function(frame, relativeFrame) {
    this.shaderPass.uniforms.time.value = relativeFrame;
};

TemplateLayer.prototype.resize = function() {
};

TemplateLayer.prototype.render = function(renderer, interpolation) {
};
