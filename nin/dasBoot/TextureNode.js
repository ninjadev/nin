const Loader = require('./Loader');
const Node = require('./node');
const TextureOutput = require('./TextureOutput');

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
