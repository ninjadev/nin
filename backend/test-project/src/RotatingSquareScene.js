/* if you do this, you will be able to add things as a layer in nin */

function RotatingSquareScene(){

    this.camera = new THREE.PerspectiveCamera(45, 16/9, 1, 1000);
    this.camera.position.z = 200;

    this.scene = new THREE.Scene();

    var geometry = new THREE.CubeGeometry(200, 100, 2);
    var material = new THREE.MeshLambertMaterial({
        color: 0x00f0f0
    });

    this.cube = new THREE.Mesh(geometry, material);
    this.scene.add(this.cube);

    var light = new THREE.PointLight(0xffffff);
    light.position = new THREE.Vector3(0,100,400);
    this.scene.add(light);
}

RotatingSquareScene.prototype.update = function(t){
    this.cube.rotation.x = t * this.rotationSpeed / 100;
    this.cube.rotation.y = t * (this.rotationSpeed * 5) / 100;
    this.cube.material.color.setRGB(
            0.5 * (1 + Math.sin(t * 2 * Math.PI)),
            0.5 * (1 + Math.cos(t * 2 * Math.PI)),
            0.5 * (1 + Math.sin(t * 2 * Math.PI))
    );
}

RotatingSquareScene.prototype.render = function(renderer){
    renderer.render(this.scene, this.camera);
}
