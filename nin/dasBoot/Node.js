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
