const Loader = require('./Loader');

class Input {
  constructor(node) {
    this.source = null;
    this.node = node;
    this.enabled = true;
  }

  getValue() {
    if(!this.source) {
      return null;
    }
    return this.source.getValue();
  }
}

class Output {
  constructor(node) {
    this.destination = null;
    this.node = node;
  }

  setValue(value) {
    this.value = value;
  }

  getValue() {
    return this.value;
  }
}

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


class TextureInput extends Input {}

class TextureOutput extends Output {}

class TextureNode extends Node {
  constructor(id, options) {
    super(id, {
      inputs: {},
      outputs: {
        A: new TextureOutput()
      }
    });
    var that = this;
    this.texture = Loader.loadTexture(options.path);
    this.outputs.A.setValue(this.texture);
  }
}

module.exports = TextureNode;

module.exports = {
  Input,
  Output,
  Node,
  TextureInput,
  TextureOutput,
  TextureNode,
};
