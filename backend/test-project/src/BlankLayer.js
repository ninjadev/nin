/**
 * @constructor
 */
function BlankLayer(config) {
  console.log(config.offset);
  this.offset = config.offset;
  this.scene = new THREE.Scene();
  this.camera = new THREE.PerspectiveCamera(45, 16 / 9, 1, 10000);
  this.cube = new THREE.Mesh(new THREE.BoxGeometry(50, 50, 50),
                             new THREE.MeshLambertMaterial({color: 0xf0f000}));

  this.cube.position.x = 45 * this.offset;
  this.scene.add(this.cube);
  this.camera.position.z = 300;

  var light = new THREE.PointLight( 0xffffff, 1, 100 );
  light.position.set( -50, -50, -50 );
  this.scene.add(light);

  var pointLight = new THREE.PointLight(0xFFFFFF);
  pointLight.position.x = 10;
  pointLight.position.y = 50;
  pointLight.position.z = 130;
  this.scene.add(pointLight);
}

BlankLayer.prototype.start = function() {
};

BlankLayer.prototype.render = function(renderer, interpolation) {
  renderer.render(this.scene, this.camera);
};

BlankLayer.prototype.update = function(frame) {
  this.cube.rotation.x = Math.sin(frame / 10 + this.offset);
  this.cube.rotation.y = Math.cos(frame / 10 + this.offset);
};
