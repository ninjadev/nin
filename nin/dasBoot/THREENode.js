(function(NIN) {
  'use strict';

  class THREENode extends NIN.Node {
    constructor(id, options) {
      super(id, {
        inputs: options.inputs,
        outputs: {
          render: new NIN.TextureOutput()
        }
      });

      this.scene = new THREE.Scene();
      this.renderTarget = new THREE.WebGLRenderTarget(640, 360, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBFormat
      });

      if (options.camera) {
        this.cameraController = new CameraController();
        this.camera = this.cameraController.camera;
        Loader.loadAjax(options.camera, response => {
          const rawPath = JSON.parse(response);
          this.cameraController.parseCameraPath(rawPath);
        });
      } else {
        this.camera = new THREE.PerspectiveCamera(45, 16/9, 1, 10000);
      }
    }

    resize() {
      this.renderTarget.setSize(16 * GU, 9 * GU);
    }

    render(renderer) {
      renderer.render(this.scene, this.camera, this.renderTarget, true);
      this.outputs.render.setValue(this.renderTarget.texture);
    }

    update(frame) {
      this.cameraController.updateCamera(frame);
    }
  }

  NIN.THREENode = THREENode;
})(this.NIN);
