const CameraController = require('./CameraController');
const Loader = require('./Loader');
const Node = require('./node');

class THREENode extends Node {
  constructor(id, options) {
    super(id, {
      inputs: options.inputs,
      outputs: {
        render: new NIN.TextureOutput()
      }
    });
    this.options = options;

    this.scene = new THREE.Scene();
    this.renderTarget = new THREE.WebGLRenderTarget(640, 360, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBFormat
    });

    if (options.camera) {
      this.cameraController = new CameraController();
      this.camera = this.cameraController.camera;
      Loader.loadAjax(options.camera, response => this.initializeCamera(response));
    } else {
      this.camera = new THREE.PerspectiveCamera(45, 16/9, 1, 10000);
    }
  }

  initializeCamera(rawRawPath) {
    const rawPath = JSON.parse(rawRawPath);
    this.cameraController.parseCameraPath(rawPath);
  }

  resize() {
    this.renderTarget.setSize(16 * window.GU, 9 * window.GU);
  }

  render(renderer) {
    renderer.render(this.scene, this.camera, this.renderTarget, true);
    this.outputs.render.setValue(this.renderTarget.texture);
  }

  update(frame) {
    if (this.cameraController) {
      this.cameraController.updateCamera(frame);
    }
  }
}

module.exports = THREENode;
