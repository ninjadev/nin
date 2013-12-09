/* if you do this, you will be able to add things as a layer in nin */

function BouncingCircleScene(){

    this.camera = new THREE.PerspectiveCamera(45, 16/9, 1, 1000);
    this.camera.position.z = 200;

    this.scene = new THREE.Scene();

    var geometry = new THREE.SphereGeometry(50, 50, 16);
    var material = new THREE.MeshLambertMaterial({
        color: 0xf0f000
    });

    this.sphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.sphere);

    var light = new THREE.PointLight(0xffffff);
    light.position = new THREE.Vector3(0,100,400);
    this.scene.add(light);
}

BouncingCircleScene.prototype.update = function(t){
    this.sphere.position.x = 100 * Math.sin(t / 1);
    this.sphere.position.z = 100 * Math.cos(t / 5);
}

BouncingCircleScene.prototype.render = function(renderer){
    renderer.render(this.scene, this.camera);
}
