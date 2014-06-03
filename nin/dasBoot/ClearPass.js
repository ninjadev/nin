/*
 * @constructor
 */
function ClearPass() {
  this.enabled = true;
  this.scene = new THREE.Scene();
  this.camera = new THREE.OrthographicCamera();
};

ClearPass.prototype.render = function(renderer, writeBuffer, readBuffer) {
    renderer.render(this.scene, this.camera, readBuffer, true);
};
