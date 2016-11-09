(function(NIN) {
  'use strict';

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

  NIN.Output = Output;
})(this.NIN);
