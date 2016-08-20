(function(NIN) {
  'use strict';

  class CameraNode extends NIN.Node {
    constructor(id, options) {
      super(id, {
        outputs: {
          camera: new NIN.CameraOutput()
        }
      });

      Loader.loadAjax(options.path, response => {
        var rawPath = JSON.parse(response);
        this.cameraController = new CameraController(rawPath);
        this.outputs.camera.setValue(this.cameraController.camera);
      });
    }

    update(frame) {
      this.cameraController.updateCamera(frame);
    }
  }

  NIN.CameraNode = CameraNode;
})(this.NIN);

