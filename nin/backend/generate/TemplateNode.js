(function(global) {
  class TemplateNode extends NIN.Node {
    constructor(id) {
      super(id, {
        outputs: {
          out: new NIN.Output()
        }
      });
    }

    render() {
      this.outputs.out.setValue(1);
    }
  }

  global.TemplateNode = TemplateNode;
})(this);
