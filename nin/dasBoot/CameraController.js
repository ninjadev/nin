function CameraController(layer_id) {
  console.log('started CC', layer_id);
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
  if (!raw_path) {
    console.warn("No camera path for layer %d", this.layer_id);
    return;
  }

  if (raw_path.position) {
    this.position = this.parse3Dkeyframes(raw_path.position);
  }
  if (raw_path.lookAt) {
    this.lookAt = this.parse3Dkeyframes(raw_path.lookAt);
  }
  if (raw_path.roll) {
    this.roll = this.parseKeyframes(raw_path.roll);
  }
  if (raw_path.fov) {
    this.fov = this.parseKeyframes(raw_path.fov);
  }
  if (raw_path.shake) {
    this.shake = this.parseKeyframes(raw_path.shake);
  }
};

CameraController.prototype.parse3Dkeyframes = function(keyframes) {
  var parsed = [];
  for (var i=0; i<keyframes.length; i++) {
    var this_pos = {
      type: keyframes[i].type,
      startFrame: keyframes[i].startFrame,
      endFrame: keyframes[i].endFrame,
      easing: keyframes[i].easing
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
CameraController.prototype.parseKeyframes = function(keyframes) {
  var parsed = [];
  for (var i=0; i < keyframes.length; i++) {
    var current = {
      type: keyframes[i].type,
      startFrame: keyframes[i].startFrame,
      endFrame: keyframes[i].endFrame,
      easing: keyframes[i].easing
    };
    if (current.type == "transition") {
      current.from = keyframes[i].from;
      current.to = keyframes[i].to;
    } else if (current.type == "fixed") {
      current.value = keyframes[i].value;
    }
    parsed[i] = current;
  }
  return parsed;
};

CameraController.prototype.updateCamera = function(frame) {
  if (this.pause) return;

  if (this.position) {
    var pos = this.get3Dpoint(this.position, frame);
    this.camera.position = pos;
  }

  if (this.lookAt) {
    var lookAt = this.get3Dpoint(this.lookAt, frame);
    this.camera.lookAt(lookAt);
  }

  if (this.roll) {
    var roll = this.getPoint(this.roll, frame);
    this.camera.rotateOnAxis(this.rotVector, roll);
  }

  if (this.fov) {
    var fov = this.getPoint(this.fov, frame);
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  if (this.shake) {
    var shake = this.getPoint(this.shake, frame);
    this.camera.position.add(new THREE.Vector3(
      (Math.random() - .5) * shake,
      (Math.random() - .5) * shake,
      (Math.random() - .5) * shake
    ));
  }
};

CameraController.prototype.getCurrentPath = function(keyframes, frame) {
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
    if (current === undefined) {
      current = keyframes[0];
    }
  }
  return current;
};

CameraController.prototype.get3Dpoint = function(keyframes, frame) {
  var current = this.getCurrentPath(keyframes, frame);

  if (current.type == "spline") {
    if (frame > current.endFrame) {
      return current.points.points[current.points.points.length-1];
    }
    var spline_duration = current.endFrame - current.startFrame;
    var t = (frame - current.startFrame) / spline_duration;
    if (current.easing == "smoothstep") {
      var s_t = smoothstep(0, 1, t);
    } else if (current.easing == "easeIn") {
      var s_t = easeIn(0, 1, t);
    } else if (current.easing == "easeOut") {
      var s_t = easeOut(0, 1, t);
    } else {
      var s_t = t;
    }
    return current.points.getPointAt(s_t);
  }
  return current.point;
};

CameraController.prototype.getPoint = function(keyframes, frame) {
  var current = this.getCurrentPath(keyframes, frame);

  if (current.type == "transition") {
    if (frame > current.endFrame) {
      return current.to;
    }
    var duration = current.endFrame - current.startFrame;
    var t = (frame - current.startFrame) / duration;
    if (current.easing == "smoothstep") {
      return smoothstep(current.from, current.to, t);
    } else if (current.easing == "easeOut") {
      return easeOut(current.from, current.to, t);
    } else if (current.easing == "easeIn") {
      return easeIn(current.from, current.to, t);
    }
    return lerp(current.from, current.to, t);
  }
  return current.value;
};
