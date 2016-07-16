function CameraController(layer_id) {
  console.log('started CC', layer_id);
  if (layer_id in CameraController.layers) {
    if (!CameraController.layers[layer_id].loaded && Object.keys(CameraController.paths).length > 0) {
      this.parseCameraPath(CameraController.paths);
    }
    return CameraController.layers[layer_id];
  }
  CameraController.layers[layer_id] = this;

  this.layer_id = layer_id;

  this.camera = new THREE.PerspectiveCamera(45, 16/9, 1, 50000);
  this.rotVector = new THREE.Vector3(0, 0, 1);
  this.pause = false;

  if (Object.keys(CameraController.paths).length > 0) {
    this.parseCameraPath(CameraController.paths);
    this.generateVisualization();
  }
}

CameraController.layers = {};
CameraController.paths = {};

CameraController.prototype.getVisualization = function() {
  return this.visualization;
}

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
}

CameraController.prototype.parseCameraPath = function(camera_paths) {
  this.loaded = true;
  var raw_path = camera_paths[this.layer_id];
  if (!raw_path) {
    console.warn("No camera path for layer %d", this.layer_id);
    return;
  }

  if (raw_path.position) {
    this.position = new PathController(raw_path.position, '3D');
  }
  if (raw_path.lookAt) {
    this.lookAt = new PathController(raw_path.lookAt, '3D');
  }
  if (raw_path.roll) {
    this.roll = new PathController(raw_path.roll, '1D');
  }
  if (raw_path.fov) {
    this.fov = new PathController(raw_path.fov, '1D');
  }
  if (raw_path.shake) {
    this.shake = new PathController(raw_path.shake, '1D');
  }
};

CameraController.prototype.updateCamera = function(frame) {
  if (this.position) {
    var pos = this.position.get3Dpoint(frame);

    if (!this.pause) {
      this.camera.position.copy(pos);
    }
    this.visualization.position.copy(pos);
  }

  if (this.lookAt) {
    var lookAt = this.lookAt.get3Dpoint(frame);

    if (!this.pause) {
      this.camera.lookAt(lookAt);
    }
    this.visualization.lookAt(lookAt);
  }

  if (this.roll) {
    var roll = this.roll.getPoint(frame);

    if (!this.pause) {
      this.camera.rotateOnAxis(this.rotVector, roll);
    }

    this.visualization.rotateOnAxis(this.rotVector, roll);
  }

  if (this.pause) return;

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
    this.visualization.position.add(amount);
  }
};
