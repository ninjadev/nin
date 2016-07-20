(function(NIN) {
  'use strict';

  class ShaderPassNode extends NIN.Node {
    constructor(id, options) {
      super(id, {
        inputs: options.inputs,
        outputs: {
          A: new NIN.TextureOutput()
        }
      });
      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1); 
      this.scene = new THREE.Scene();
      this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2),
                                 new THREE.ShaderMaterial(options.shader));
      this.shader = this.quad.material;
      this.scene.add(this.quad);
      this.renderTarget = new THREE.WebGLRenderTarget(640, 360, {
        minFilter: THREE.LinearFilter, 
        magFilter: THREE.LinearFilter, 
        format: THREE.RGBFormat
      });
    }
    
    resize() {
      this.renderTarget.setSize(16 * GU, 9 * GU);
    }

    render(renderer) {
      renderer.render(this.scene, this.camera, this.renderTarget, true);
      this.outputs.A.setValue(this.renderTarget.texture);
    }
  }

  NIN.ShaderPassNode = ShaderPassNode;
})(this.NIN);
