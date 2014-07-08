function CameraController(layer_id) {
  if (layer_id in CameraController.layers) {
    return CameraController.layers[layer_id];
  }
  CameraController.layers[layer_id] = this;

  this.layer_id = layer_id;

  this.camera = new THREE.PerspectiveCamera(45, 16/9, 1, 50000);
  this.rotVector = new THREE.Vector3(0, 0, -1);
  this.pause = false;

  if (CameraController.paths.length > 0) {
    this.parseCameraPath(CameraController.paths);
  }
};

CameraController.layers = {};
CameraController.paths = [];

CameraController.prototype.parseCameraPath = function(camera_paths) {
  var raw_path = camera_paths[this.layer_id];

  this.position = this.parse3Dkeyframes(raw_path.position);
  this.lookAt = this.parse3Dkeyframes(raw_path.lookAt);
};

CameraController.prototype.parse3Dkeyframes = function(keyframes) {
  var parsed = [];
  for (var i=0; i<keyframes.length; i++) {
    var this_pos = {
      type: keyframes[i].type,
      startFrame: keyframes[i].startFrame,
      endFrame: keyframes[i].endFrame
    };
    if (this_pos.type == "spline") {
      var points = [];
      for (var j=0; j<keyframes[i].points.length; j++) {
        var point = keyframes[i].points[j];
        points[j] = new THREE.Vector3(point[0], point[1], point[2]);
      }
      this_pos.points = new THREE.SplineCurve3(points);
    } else if (this_pos.type == "point") {
      var point = new THREE.Vector3(
          keyframes[i].point[0],
          keyframes[i].point[1],
          keyframes[i].point[2]
          );
      this_pos.point = point;
    }
    parsed[i] = this_pos;
  }
  return parsed;
};

CameraController.prototype.updateCamera = function(frame) {
  if (this.pause) return;

  var pos = this.get3Dpoint(this.position, frame);
  this.camera.position = pos;

  var lookAt = this.get3Dpoint(this.lookAt, frame);
  this.camera.lookAt(lookAt);

  /* TODO: Implement the rest of this
  var rotation = this.rotSpline.getPointAt(relativeT/30000).x;
  this.camera.rotateOnAxis(this.rotVector, rotation);

  var fov = this.fovSpline.getPointAt(relativeT/30000).x;
  this.camera.fov = fov;
  this.camera.updateProjectionMatrix();
  */
};

CameraController.prototype.get3Dpoint = function(keyframes, frame) {
  var current;
  for (var i=0; i<keyframes.length; i++) {
    if (frame >= keyframes[i].startFrame && frame <= keyframes[i].endFrame) {
      current = keyframes[i];
      break;
    }
  }
  if (current === undefined) {
    for (var i=0; i < keyframes.length; i++) {
      if (frame > keyframes[i].startFrame) {
        current = keyframes[i];
      }
    }
  }

  if (current.type == "spline") {
    if (frame > current.endFrame) {
      return current.points.points[current.points.points.length-1];
    }
    var spline_duration = current.endFrame - current.startFrame;
    var s_t = (frame - current.startFrame) / spline_duration;
    return current.points.getPointAt(s_t);
  }
  return current.point;
};
