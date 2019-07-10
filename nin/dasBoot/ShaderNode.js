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
  }

  render(renderer) {
    const renderTarget = NIN.FullscreenRenderTargetPool.getFullscreenRenderTarget();
    renderer.setRenderTarget(renderTarget);
    renderer.clear();
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(null);
    this.outputs.render.setValue(renderTarget.texture);
  }
}

module.exports = ShaderNode;
