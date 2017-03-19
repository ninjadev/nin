function camera(demo) {
  let controls;
  let cc;
  const clock = new THREE.Clock();
  let active = false;
  let selectedInput;
  let camera;

  const mouseclick = function(e) {
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

    vector.unproject(camera);

    const dir_vector = vector.sub(camera.position).normalize();
    const raycaster = new THREE.Raycaster(camera.position, dir_vector);

    const intersects = raycaster.intersectObjects(
      selectedInput.node.scene.children,
      true
    );

    if (intersects.length > 0) {
      const point = intersects[0].point;
      camera.lookAt(point);
    }
  };

  const updateCallback = function() {
    if (!active) return;

    const delta = clock.getDelta();
    controls.update(delta);
    requestAnimFrame(updateCallback);
  };

  const roundify = function(n, decimals) {
    const orders_of_magnitude = Math.pow(10, decimals); // POP! POP!
    return Math.round(n * orders_of_magnitude) / orders_of_magnitude;
  };

  return {
    getCameraPosition() {
      if (!camera) return;
      return JSON.stringify([
        roundify(camera.position.x, 2),
        roundify(camera.position.y, 2),
        roundify(camera.position.z, 2)
      ]) + ',';
    },
    getCameraLookat() {
      if (!camera) return;
      var scene = selectedInput.node.scene;
      var vector = new THREE.Vector3(0, 0, 0.5);

      vector.unproject(camera);
      var dir_vector = vector.sub(camera.position).normalize();
      var raycaster = new THREE.Raycaster(camera.position, dir_vector);
      var intersects = raycaster.intersectObjects(scene.children, true);

      var point;
      if (intersects.length > 0) {
        point = intersects[0].point;
      } else {
        var distance = - camera.position.z / dir_vector.z;
        point = camera.position.clone().add(dir_vector.multiplyScalar(distance));
      }
      return JSON.stringify([
        roundify(point.x, 2),
        roundify(point.y, 2),
        roundify(point.z, 2)
      ]) + ',';
    },
    getCameraRoll() {
      if (!camera) return;
      return roundify(camera.rotation.z, 2);
    },
    getCameraFov() {
      if (!camera) return;
      return roundify(camera.fov, 2);
    },
    toggleFlyAroundMode() {
      active = !active;
      if (cc) {
        cc.pause = !cc.pause;
      }
      if (active) {
        camera = selectedInput.source.node.cameraController.camera;
        controls = new THREE.FlyControls(camera, demo.renderer.domElement.parentElement);
        controls.movementSpeed = 400;
        controls.rollSpeed = Math.PI / 4 * 16;
        controls.autoForward = false;
        controls.dragToLook = true;
        requestAnimFrame(updateCallback);
        demo.renderer.domElement.parentElement.addEventListener('click', mouseclick);
      } else {
        if (cc) {
          cc.updateCamera(demo.looper.currentFrame);
        }
        demo.renderer.domElement.parentElement.removeEventListener('click', mouseclick);
      }
    },
    resetFlyFlightDynamics() {
      if (!camera) return;
      camera.rotation.x = 0;
      camera.rotation.z = 0;
    },
    deltaFov(delta) {
      if (!camera) return;
      camera.fov += delta;
      camera.updateProjectionMatrix();
    },
    getSelectedInput() {
      return selectedInput;
    },
    startEdit(cameraInput) {
      if (selectedInput) {
        active = false;
        if (cc) {
          cc.pause = false;
        }
        demo.renderer.domElement.parentElement.removeEventListener('click', mouseclick);
      }

      selectedInput = cameraInput;

      cc = selectedInput.source.node.cameraController;
    }
  };
}

module.exports = camera;
