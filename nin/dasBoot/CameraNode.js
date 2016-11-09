(function(NIN) {
  'use strict';

  class CameraNode extends NIN.Node {
    constructor(id, options) {
      super(id, {
        outputs: {
          camera: new NIN.CameraOutput()
        }
      });

      this.options = options;

      this.cameraController = new CameraController();
      this.outputs.camera.setValue(this.cameraController.camera);
      Loader.loadAjax(options.path, response => this.initializeCamera(response));
    }

    initializeCamera(rawRawPath) {
      var rawPath = JSON.parse(rawRawPath);
      this.cameraController.parseCameraPath(rawPath);
    }

    update(frame) {
      this.cameraController.updateCamera(frame);
    }
  }

  NIN.CameraNode = CameraNode;
})(this.NIN);

