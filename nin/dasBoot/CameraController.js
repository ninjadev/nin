function CameraController(rawPath) {
  this.camera = new THREE.PerspectiveCamera(45, 16/9, 1, 50000);
  this.rotVector = new THREE.Vector3(0, 0, 1);
  this.pause = false;

  this.generateVisualization();
  if (rawPath) {
    this.parseCameraPath(rawPath);
  }
}

CameraController.prototype.getVisualization = function() {
  return this.visualization;
};

CameraController.prototype.generateVisualization = function() {
  this.visualization = new THREE.Object3D();

  var m = new THREE.MeshBasicMaterial({ color: 0xCC3300 });
  var base = new THREE.Mesh(new THREE.BoxGeometry(8, 10, 22), m);
  var leftReel = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 5, 30), m);
  var rightReel = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 5, 30), m);
  var cone = new THREE.Mesh(new THREE.CylinderGeometry(2, 5, 15), m);

  leftReel.rotation.z = rightReel.rotation.z = Math.PI / 2;
  leftReel.position.y = rightReel.position.y = 10;
  leftReel.position.z = -(rightReel.position.z = 5.5);

  cone.rotation.x = -Math.PI / 2;
  cone.position.z = 16;

  this.visualization.add(cone);
  this.visualization.add(base);
  this.visualization.add(leftReel);
  this.visualization.add(rightReel);
};

CameraController.prototype.parseCameraPath = function(rawPath) {
  if (rawPath.position) {
    this.position = new PathController(rawPath.position, '3D');
  }
  if (rawPath.lookAt) {
    this.lookAt = new PathController(rawPath.lookAt, '3D');
  }
  if (rawPath.roll) {
    this.roll = new PathController(rawPath.roll, '1D');
  }
  if (rawPath.fov) {
    this.fov = new PathController(rawPath.fov, '1D');
  }
  if (rawPath.shake) {
    this.shake = new PathController(rawPath.shake, '1D');
  }
};

CameraController.prototype.updateCamera = function(frame) {
  if (this.position) {
    var pos = this.position.get3Dpoint(frame);

    if (!this.pause) {
      this.camera.position.copy(pos);
    }
    //this.visualization.position.copy(pos);
  }

  if (this.lookAt) {
    var lookAt = this.lookAt.get3Dpoint(frame);

    if (!this.pause) {
      this.camera.lookAt(lookAt);
    }
    //this.visualization.lookAt(lookAt);
  }

  if (this.roll) {
    var roll = this.roll.getPoint(frame);

    if (!this.pause) {
      this.camera.rotateOnAxis(this.rotVector, roll);
    }

    //this.visualization.rotateOnAxis(this.rotVector, roll);
  }

  if (this.pause) {
    return;
  }

  if (this.fov) {
    var fov = this.fov.getPoint(frame);

    if (!this.pause) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }
  }

  if (this.shake) {
    var shake = this.shake.getPoint(frame);
    var amount = new THREE.Vector3(
      (Math.random() - 0.5) * shake,
      (Math.random() - 0.5) * shake,
      (Math.random() - 0.5) * shake
    );

    if (!this.pause) {
      this.camera.position.add(amount);
    }
    //this.visualization.position.add(amount);
  }
};
