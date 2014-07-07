/**
 * @constructor
 */
function NoiseFXLayer(config) {
  this.config = config;
  this.shaderPass = new THREE.ShaderPass(SHADERS.noise);
}

NoiseFXLayer.prototype.getEffectComposerPass = function() {
  return this.shaderPass;
};

NoiseFXLayer.prototype.start = function() {
};

NoiseFXLayer.prototype.end = function() {
};

NoiseFXLayer.prototype.update = function(frame) {
    var relativeFrame = frame - this.config.startFrame;
    this.shaderPass.uniforms.width.value = 16 * 8;
    this.shaderPass.uniforms.height.value = 9 * 8;
    this.shaderPass.uniforms.time.value = frame;
    this.shaderPass.uniforms.amount.value = lerp(0, 0.3, Math.min(relativeFrame / 100, 1));
};
