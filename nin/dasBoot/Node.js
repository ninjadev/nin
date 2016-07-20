(function(NIN) {
  'use strict';

  class Node {
    constructor(id, options) {
      this.id = id;
      this.inputs = options.inputs || {};
      this.outputs = options.outputs || {};
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
