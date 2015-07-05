/**
 * @constructor
 */
function BlankLayer(layer) {
  this.offset = layer.config.offset;
  this.scene = new THREE.Scene();

  this.cameraController = new CameraController(layer.type);
  this.camera = this.cameraController.camera;
  this.cube = new THREE.Mesh(new THREE.BoxGeometry(50, 5, 5),
                             new THREE.ShaderMaterial(SHADERS.example));

  this.cube.position.x = 45 * this.offset;
  this.scene.add(this.cube);

  var light = new THREE.PointLight( 0xffffff, 1, 100 );
  light.position.set( -50, -50, -50 );
  this.scene.add(light);

  var pointLight = new THREE.PointLight(0xFFFFFF);
  pointLight.position.x = 10;
  pointLight.position.y = 50;
  pointLight.position.z = 130;
  this.scene.add(pointLight);

  this.renderPass = new THREE.RenderPass(this.scene, this.camera);
}

BlankLayer.prototype.getEffectComposerPass = function() {
  return this.renderPass;
};

BlankLayer.prototype.start = function() {
};

BlankLayer.prototype.end = function() {
};

BlankLayer.prototype.render = function(renderer, interpolation) {
  renderer.render(this.scene, this.camera);
};

BlankLayer.prototype.update = function(frame, relativeFrame) {
  this.cube.rotation.x = Math.sin(frame / 10 + this.offset);
  this.cube.rotation.y = Math.cos(frame / 10 + this.offset);

  this.cameraController.updateCamera(relativeFrame);
};
