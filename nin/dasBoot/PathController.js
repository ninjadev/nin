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

PathController.prototype.parseKeyframes = function(keyframes) {
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

PathController.prototype.get3Dpoint = function(frame) {
  var current = this.getCurrentPath(frame);

  if (current.type == "spline") {
    if (frame > current.endFrame) {
      return current.points.points[current.points.points.length-1];
    }
    var spline_duration = current.endFrame - current.startFrame;
    var t = (frame - current.startFrame) / spline_duration;
    var s_t = t;
    if (current.easing == "smoothstep") {
      s_t = smoothstep(0, 1, t);
    } else if (current.easing == "easeIn") {
      s_t = easeIn(0, 1, t);
    } else if (current.easing == "easeOut") {
      s_t = easeOut(0, 1, t);
    }
    return current.points.getPointAt(s_t);
  }
  return current.point;
};

PathController.prototype.getPoint = function(frame) {
  var current = this.getCurrentPath(frame);

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
