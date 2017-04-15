(function(global) {
  class TemplateShaderNode extends NIN.ShaderNode {
    constructor(id, options) {
      super(id, options);
    }

    update(frame) {
      this.uniforms.frame.value = frame;
    }
  }

  global.TemplateShaderNode = TemplateShaderNode;
})(this);
