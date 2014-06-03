/*
 * @constructor
 */
function ClearPass() {
  this.enabled = true;
  this.scene = new THREE.Scene();
  this.camera = new THREE.OrthographicCamera();
};

ClearPass.prototype.render = function(renderer, writeBuffer, readBuffer) {
    console.log('clear!');
    renderer.render(this.scene, this.camera, readBuffer, true);
};
