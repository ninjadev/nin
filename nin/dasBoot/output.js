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

module.exports = Output;
