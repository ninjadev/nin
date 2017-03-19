(function(NIN) {
  'use strict';

  class Node {
    constructor(id, options) {
      this.id = id;
      this.inputs = options.inputs || {};
      this.outputs = options.outputs || {};

      for(var key in this.inputs) {
        this.inputs[key].node = this;
      }
      for(var key in this.outputs) {
        this.outputs[key].node = this;
      }

      this.oldActive = false;
      this.active = false;
    }

    resize() {
    }

    render() {
    }

    update() {
    }
  }

  NIN.Node = Node;
})(this.NIN);

(function(NIN) {
  'use strict';

  class ShaderNode extends NIN.Node {
    constructor(id, options) {
      super(id, {
        inputs: options.inputs,
        outputs: {
          render: new NIN.TextureOutput()
        }
      });

      this.scene = new THREE.Scene();
      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 100);
      this.renderTarget = new THREE.WebGLRenderTarget(640, 360, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBFormat
      });

      const {uniforms, vertexShader, fragmentShader} = options.shader;
      const quad = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(2, 2),
        new THREE.ShaderMaterial({
          uniforms,
          vertexShader,
          fragmentShader,
        })
      );

      this.scene.add(quad);
    }

    update() {
    }

    resize() {
      this.renderTarget.setSize(16 * GU, 9 * GU);
    }

    render(renderer) {
      renderer.render(this.scene, this.camera, this.renderTarget, true);
      this.outputs.render.setValue(this.renderTarget.texture);
    }
  }

  NIN.ShaderNode = ShaderNode;
})(this.NIN);
