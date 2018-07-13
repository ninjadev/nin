(function (global) {
  class TemplateOverlayNode extends NIN.ShaderNode {
    constructor(id, options) {
      options.inputs = {
        overlay: new NIN.TextureInput(),
        background: new NIN.TextureInput(),
      };
      super(id, options);
    }

    update(frame) {
      this.uniforms.frame.value = frame;
      this.uniforms.overlay.value = this.inputs.overlay.getValue();
      this.uniforms.background.value = this.inputs.background.getValue();
    }
  }

  global.TemplateOverlayNode = TemplateOverlayNode;
})(this);
