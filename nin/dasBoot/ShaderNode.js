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

    const shader = typeof options.shader === 'string'
      ? SHADERS[options.shader] : options.shader;

    this.quad = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(2, 2),
      new THREE.ShaderMaterial(shader).clone());
    this.uniforms = this.quad.material.uniforms;

    this.scene.add(this.quad);
    this.resize();
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

module.exports = ShaderNode;
