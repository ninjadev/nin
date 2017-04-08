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
  for (var i = 0; i < keyframes.length; i++) {
    var this_pos = {
      type: keyframes[i].type,
      startFrame: keyframes[i].startFrame,
      endFrame: keyframes[i].endFrame,
      easing: keyframes[i].easing
    };
    if (this_pos.type == 'circle') {
      this_pos.radius = new PathController([{
        startFrame: keyframes[i].startFrame,
        endFrame: keyframes[i].endFrame,
        points: keyframes[i].radius,
      }], '1D');
      this_pos.center = new PathController([{
        startFrame: keyframes[i].startFrame,
        endFrame: keyframes[i].endFrame,
        points: keyframes[i].center,
      }], '3D');
      this_pos.offset = keyframes[i].offset || 0;
      this_pos.length = keyframes[i].length || 1;
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
      } else if (typeof raw_points[0] === 'number' && raw_points.length == 3) {
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
        for (var j = 0; j < raw_points.length; j++) {
          var point = raw_points[j];
          points[j] = new THREE.Vector3(point[0], point[1], point[2]);
        }
        this_pos.points = new THREE.CatmullRomCurve3(points);
      }
    }
    parsed[i] = this_pos;
  }
  return parsed;
};

PathController.prototype.parseKeyframes = function(keyframes) {
  var parsed = [];
  for (var i = 0; i < keyframes.length; i++) {
    var current = {
      type: keyframes[i].type,
      startFrame: keyframes[i].startFrame,
      endFrame: keyframes[i].endFrame,
      easing: keyframes[i].easing
    };

    var raw_points = keyframes[i].hasOwnProperty('value')
      ? keyframes[i].value
      : keyframes[i].hasOwnProperty('point')
        ? keyframes[i].point
        : keyframes[i].points;

    if (raw_points) {
      if (typeof raw_points === 'number') {
        current.type = 'value';
        current.value = raw_points;
      } else if (raw_points.length == 1) {
        current.type = 'value';
        current.value = raw_points[0];
      } else if (raw_points.length == 2) {
        current.type = 'linear';
        current.from = raw_points[0];
        current.to = raw_points[1];
      } else if (keyframes[i].from && keyframes[i].to) {
        current.type = 'linear';
        current.from = keyframes[i].from;
        current.to = keyframes[i].to;
      } else if (raw_points.length > 2) {
        console.warn('A maximum two points is currently supported');
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
  if (t < 0) {
    t = 0;
  }
  if (current.easing == 'smoothstep') {
    t = smoothstep(0, 1, t);
  } else if (current.easing == 'easeIn') {
    t = easeIn(0, 1, t);
  } else if (current.easing == 'easeOut') {
    t = easeOut(0, 1, t);
  }

  if (current.type == 'spline') {
    if (frame > current.endFrame) {
      return current.points.points[current.points.points.length - 1];
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
      t = 1;
    }
    t += current.offset;
    t *= current.length;
    var point = new THREE.Vector3(
      Math.sin(t * Math.PI * 2) * current.radius.getPoint(frame),
      0,
      Math.cos(t * Math.PI * 2) * current.radius.getPoint(frame)
    );
    point.applyAxisAngle(current.rotator, current.angle);
    point.add(current.center.get3Dpoint(frame));
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
    if (current.easing == 'smoothstep') {
      return smoothstep(current.from, current.to, t);
    } else if (current.easing == 'easeOut') {
      return easeOut(current.from, current.to, t);
    } else if (current.easing == 'easeIn') {
      return easeIn(current.from, current.to, t);
    }
    return lerp(current.from, current.to, t);
  } else if (current.type == 'value') {
    return current.value;
  }
};

PathController.prototype.getCurrentPath = function(frame) {
  var current;
  for (var i = 0; i < this.path.length; i++) {
    if (frame >= this.path[i].startFrame && frame <= this.path[i].endFrame) {
      current = this.path[i];
      break;
    }
  }
  if (current === undefined) {
    for (var i = 0; i < this.path.length; i++) {
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

PathController.prototype.getVisualizer = function() {
  if (this.visualizer == undefined) {
    this.visualizer = new PathControllerVisualizer(this);
  }
  return this.visualizer;
};

function PathControllerVisualizer(pathController) {
  this.pathController = pathController;
  this.cameraPath = pathController.path;
  this.pathGroup = new THREE.Object3D();
  this.cameraPathJoinPoints = [];

  this.cameraPathMaterial = new THREE.MeshBasicMaterial({color: 0xffff22});
  this.joinSegmentMaterial = new THREE.LineDashedMaterial({
    color: 0xeeeeee,
    dashSize: 3,
    gapSize: 7
  });
  this.pointMaterial = new THREE.MeshBasicMaterial({color: 0x22ff22});
  this.generateVisualization();
}

PathControllerVisualizer.prototype.getVisualization = function() {
  return this.pathGroup;
};

PathControllerVisualizer.prototype.generateCube = function(position) {
  var cube = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 5),
      this.pointMaterial);
  cube.position.copy(position);

  this.pathGroup.add(cube);
};

PathControllerVisualizer.prototype.generateLine = function(from, to) {
  this.generateCube(from);
  this.generateCube(to);

  var line = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.LineCurve(from, to)),
      this.cameraPathMaterial);

  this.pathGroup.add(line);
};

PathControllerVisualizer.prototype.generateSpline = function(spline) {
  for(var i = 0; i < spline.points.length; i++) {
    this.generateCube(spline.points[i]);
  }

  var cp = new THREE.CurvePath();
  cp.add(spline);
  this.pathGroup.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(cp),
        this.cameraPathMaterial));
};

PathControllerVisualizer.prototype.generateJoinSegments = function(spline) {
  this.cameraPathJoinPoints.pop();
  this.cameraPathJoinPoints.shift();

  for (var i = 0; i < this.cameraPathJoinPoints.length - 1; i++) {
    var geometry = new THREE.Geometry();
    geometry.vertices.push(
        this.cameraPathJoinPoints[i],
        this.cameraPathJoinPoints[i + 1]);
    geometry.computeLineDistances();

    this.pathGroup.add(new THREE.LineSegments(geometry, this.joinSegmentMaterial));
  }
};

PathControllerVisualizer.prototype.generateVisualization = function(spline) {
  for (var i = 0; i < this.cameraPath.length; i++) {
    var segment = this.cameraPath[i];
    switch (segment.type) {
      case 'point':
        this.generateCube(segment.point);
        this.cameraPathJoinPoints.push(segment.point, segment.point);
        break;

      case 'linear':
        this.generateLine(segment.from, segment.to);
        this.cameraPathJoinPoints.push(segment.from, segment.to);
        break;

      case 'spline':
        this.generateSpline(segment.points);
        this.cameraPathJoinPoints.push(
            segment.points.points[0],
            segment.points.points[2]);
        break;
    }
  }

  this.generateJoinSegments();
};
