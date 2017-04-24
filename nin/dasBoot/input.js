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

module.exports = Input;
