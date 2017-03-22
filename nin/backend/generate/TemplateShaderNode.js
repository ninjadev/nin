(function(global) {
  class TemplateShaderNode extends NIN.ShaderNode {
    constructor(id, options) {
      options.shader = SHADERS.TemplateShader;
      super(id, options);
    }

    update(frame) {
      this.uniforms.frame.value = frame;
    }
  }

  global.TemplateShaderNode = TemplateShaderNode;
})(this);
