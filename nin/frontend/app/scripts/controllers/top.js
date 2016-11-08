class TopCtrl {
  constructor($scope, camera, commands) {
    this.camera = camera;

    commands.on('toggleFlyAroundMode', function() {
      camera.toggleFlyAroundMode();
    });
    commands.on('resetFlyFlightDynamics', function() {
      camera.resetFlyFlightDynamics();
    });
    commands.on('increaseCameraZoom', function() {
      camera.deltaFov(-0.5);
    });
    commands.on('decreaseCameraZoom', function() {
      camera.deltaFov(0.5);
    });
  }

  displayValue(id, val) {
    var el = document.getElementById(id);
    el.textContent = val;
    var range = document.createRange();
    range.selectNodeContents(el);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  }

  toggleFlyAroundMode() {
    return this.camera.toggleFlyAroundMode();
  }

  resetFlyFlightDynamics() {
    return this.camera.resetFlyFlightDynamics();
  }

  get cameraPosition() {
    return this.camera.getCameraPosition();
  }

  get cameraLookat() {
    return this.camera.getCameraLookat();
  }

  get cameraRoll() {
    return this.camera.getCameraRoll();
  }

  get cameraFov() {
    return this.camera.getCameraFov();
  }
}

module.exports = TopCtrl;
