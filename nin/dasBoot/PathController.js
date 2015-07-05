function PathController(raw_path, path_type) {
  this.path_type = path_type || '3D';

  if (this.path_type == '3D') {
    this.path = this.parse3Dkeyframes(raw_path);
  } else if (this.path_type == '1D') {
    this.path = this.parseKeyframes(raw_path);
  }
}

PathController.prototype.parse3Dkeyframes = function(keyframes) {
  var parsed = [];
  for (var i=0; i<keyframes.length; i++) {
    var this_pos = {
      type: keyframes[i].type,
      startFrame: keyframes[i].startFrame,
      endFrame: keyframes[i].endFrame,
      easing: keyframes[i].easing
    };
    if (this_pos.type == 'circle') {
      this_pos.radius = keyframes[i].radius;
      this_pos.center = new THREE.Vector3(
        keyframes[i].center[0], keyframes[i].center[1], keyframes[i].center[2]
      );
      if (keyframes[i].up) {
        var up = new THREE.Vector3(
          keyframes[i].up[0], keyframes[i].up[1], keyframes[i].up[2]
        );
        this_pos.angle = new THREE.Vector3(0, 1, 0).angleTo(up);
        this_pos.rotator = new THREE.Vector3(0, 1, 0).cross(up).normalize();
      } else {
        this_pos.angle = 0;
        this_pos.rotator = new THREE.Vector3(0, 1, 0);
      }
    } else if (keyframes[i].point || keyframes[i].points) {
      var raw_points = keyframes[i].point || keyframes[i].points;
      if (raw_points.length == 1) {
        this_pos.type = 'point';
        var point = new THREE.Vector3(
            raw_points[0][0],
            raw_points[0][1],
            raw_points[0][2]
            );
        this_pos.point = point;
      } else if (typeof raw_points[0] === "number" && raw_points.length == 3) {
        this_pos.type = 'point';
        var point = new THREE.Vector3(
            raw_points[0],
            raw_points[1],
            raw_points[2]
            );
        this_pos.point = point;
      } else if (raw_points.length == 2) {
        this_pos.type = 'linear';
        this_pos.from = new THREE.Vector3(
          raw_points[0][0], raw_points[0][1], raw_points[0][2]
        );
        this_pos.to = new THREE.Vector3(
          raw_points[1][0], raw_points[1][1], raw_points[1][2]
        );
      } else if (raw_points.length > 2) {
        this_pos.type = 'spline';
        var points = [];
        for (var j=0; j<raw_points.length; j++) {
          var point = raw_points[j];
          points[j] = new THREE.Vector3(point[0], point[1], point[2]);
        }
        this_pos.points = new THREE.SplineCurve3(points);
      }
    }
    parsed[i] = this_pos;
  }
  return parsed;
};

PathController.prototype.parseKeyframes = function(keyframes) {
  var parsed = [];
  for (var i=0; i < keyframes.length; i++) {
    var current = {
      type: keyframes[i].type,
      startFrame: keyframes[i].startFrame,
      endFrame: keyframes[i].endFrame,
      easing: keyframes[i].easing
    };
    var raw_points = keyframes[i].value || keyframes[i].point || keyframes[i].points;
    if (raw_points) {
      if (typeof raw_points === "number") {
        current.type = 'value';
        current.value = raw_points;
      } else if (raw_points.length == 1) {
        current.type = 'value';
        current.value = raw_points[0];
      } else if (raw_points.length == 2) {
        current.type = 'linear';
        current.from = keyframes[i].from;
        current.to = keyframes[i].to;
      } else if (raw_points.length > 2) {
        console.warn("A maximum two points is currently supported");
      }
    }
    parsed[i] = current;
  }
  return parsed;
};

PathController.prototype.get3Dpoint = function(frame) {
  var current = this.getCurrentPath(frame);
  var duration = current.endFrame - current.startFrame;
  var t = (frame - current.startFrame) / duration;
  if (current.easing == "smoothstep") {
    t = smoothstep(0, 1, t);
  } else if (current.easing == "easeIn") {
    t = easeIn(0, 1, t);
  } else if (current.easing == "easeOut") {
    t = easeOut(0, 1, t);
  }

  if (current.type == 'spline') {
    if (frame > current.endFrame) {
      return current.points.points[current.points.points.length-1];
    }
    return current.points.getPointAt(t);

  } else if (current.type == 'linear') {
    if (frame > current.endFrame) {
      return current.to;
    }
    return new THREE.Vector3(
      lerp(current.from.x, current.to.x, t),
      lerp(current.from.y, current.to.y, t),
      lerp(current.from.z, current.to.z, t)
    );

  } else if (current.type == 'point') {
    return current.point;
  } else if (current.type == 'circle') {
    if (frame > current.endFrame) {
      t = 0;
    }
    var point = new THREE.Vector3(
      Math.sin(t * Math.PI * 2) * current.radius,
      0,
      Math.cos(t * Math.PI * 2) * current.radius
    );
    point.applyAxisAngle(current.rotator, current.angle);
    point.add(current.center);
    return point;
  }
};

PathController.prototype.getPoint = function(frame) {
  var current = this.getCurrentPath(frame);

  if (current.type == 'linear') {
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
  } else if (current.type == 'value') {
    return current.value;
  }
};

PathController.prototype.getCurrentPath = function(frame) {
  var current;
  for (var i=0; i<this.path.length; i++) {
    if (frame >= this.path[i].startFrame && frame <= this.path[i].endFrame) {
      current = this.path[i];
      break;
    }
  }
  if (current === undefined) {
    for (var i=0; i < this.path.length; i++) {
      if (frame > this.path[i].startFrame) {
        current = this.path[i];
      }
    }
    if (current === undefined) {
      current = this.path[0];
    }
  }
  return current;
};
