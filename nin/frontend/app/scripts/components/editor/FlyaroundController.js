class FlyaroundController {
  constructor(node) {
    this.updateNodeInstance(node);
    this.clock = new THREE.Clock();

    this.camera.isOverriddenByFlyControls = false;

    this.outputContainer = this.outputContainer || document.createElement('textarea');
    this.outputContainer.className = 'flycontrols-output-container';
    document.body.appendChild(this.outputContainer);

    this.toggleFlyAroundMode();
  }

  updateNodeInstance(node) {
    this.scene = node.scene;
    this.camera = node.camera;
    this.cameraController = node.cameraController;
  }

  mouseclick(e) {
    e.preventDefault();

    const elem = demo.renderer.domElement;
    const boundingRect = elem.getBoundingClientRect();
    const x = (e.clientX - boundingRect.left) * (elem.width / boundingRect.width);
    const y = (e.clientY - boundingRect.top) * (elem.height / boundingRect.height);
    const vector = new THREE.Vector3(
      (x / elem.width) * 2 - 1,
      - (y / elem.height) * 2 + 1,
      0.5
    );

    vector.unproject(this.camera);

    const dir_vector = vector.sub(this.camera.position).normalize();
    const raycaster = new THREE.Raycaster(this.camera.position, dir_vector);

    const intersects = raycaster.intersectObjects(
      this.scene.children,
      true
    );

    console.log('intersects', intersects);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      this.camera.lookAt(point);
    }
  }

  updateCallback() {
    if (!this.camera.isOverriddenByFlyControls) return;

    const delta = this.clock.getDelta();
    this.controls.update(delta);

    this.outputContainer.innerText = `
        Position: ${this.getCameraPosition()}
        LookAt: ${this.getCameraLookat()}
        Roll: ${this.getCameraRoll()}
        Fov: ${this.getCameraFov()}
    `;

    requestAnimFrame(this.updateCallback.bind(this));
  }

  roundify(n, decimals) {
    const orders_of_magnitude = Math.pow(10, decimals); // POP! POP!
    return Math.round(n * orders_of_magnitude) / orders_of_magnitude;
  }

  getCameraPosition() {
    return JSON.stringify([
      this.roundify(this.camera.position.x, 2),
      this.roundify(this.camera.position.y, 2),
      this.roundify(this.camera.position.z, 2)
    ]) + ',';
  }

  getCameraLookat() {
    var vector = new THREE.Vector3(0, 0, 0.5);

    vector.unproject(this.camera);
    var dir_vector = vector.sub(this.camera.position).normalize();
    var raycaster = new THREE.Raycaster(this.camera.position, dir_vector);
    var intersects = raycaster.intersectObjects(this.scene.children, true);

    var point;
    if (intersects.length > 0) {
      point = intersects[0].point;
    } else {
      var distance = - this.camera.position.z / dir_vector.z;
      point = this.camera.position.clone().add(dir_vector.multiplyScalar(distance));
    }
    return JSON.stringify([
      this.roundify(point.x, 2),
      this.roundify(point.y, 2),
      this.roundify(point.z, 2)
    ]) + ',';
  }

  getCameraRoll() {
    return this.roundify(this.camera.rotation.z, 2);
  }

  getCameraFov() {
    return this.roundify(this.camera.fov, 2);
  }

  toggleFlyAroundMode() {
    this.camera.isOverriddenByFlyControls = !this.camera.isOverriddenByFlyControls;
    if (this.camera.isOverriddenByFlyControls) {
      console.log('enable flying');
      this.controls = new THREE.FlyControls(this.camera, demo.renderer.domElement.parentElement);
      this.controls.movementSpeed = 400;
      this.controls.rollSpeed = Math.PI / 4 * 16;
      this.controls.autoForward = false;
      this.controls.dragToLook = true;
      requestAnimFrame(this.updateCallback.bind(this));
      demo.renderer.domElement.parentElement.addEventListener('click', this.mouseclick.bind(this));
    } else {
      if (this.cameraController) {
        this.cameraController.updateCamera(demo.looper.currentFrame);
      }
      demo.renderer.domElement.parentElement.removeEventListener('click', this.mouseclick.bind(this));
    }
  }

  resetFlyFlightDynamics() {
    this.camera.rotation.x = 0;
    this.camera.rotation.z = 0;
  }

  deltaFov(delta) {
    this.camera.fov += delta;
    this.camera.updateProjectionMatrix();
  }
}

module.exports = FlyaroundController;
