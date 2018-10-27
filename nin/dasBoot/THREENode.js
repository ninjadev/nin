class THREENode extends NIN.Node {
  constructor(id, options) {
    if(!('outputs' in options)) {
      options.outputs = {};
    }
    if(!('render' in options.outputs)) {
      options.outputs.render = new NIN.TextureOutput();
    }
    super(id, {
      inputs: options.inputs,
      outputs: options.outputs,
    });
    this.options = options;
    this.scene = new THREE.Scene();
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
  }

  render(renderer) {
    const renderTarget = NIN.FullscreenRenderTargetPool.getFullscreenRenderTarget();
    renderer.render(this.scene, this.camera, renderTarget, true);
    this.outputs.render.setValue(renderTarget.texture);
  }

  update(frame) {
    if (this.cameraController) {
      this.cameraController.updateCamera(frame);
    }
  }
}

module.exports = THREENode;
