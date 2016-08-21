class NodeManager {

  constructor() {
    this.nodes = {};
    this.graphChangeListeners = [];
  }

  onGraphChange(fn) {
    this.graphChangeListeners.push(fn);
  }

  fireGraphChange() {
    this.graphChangeListeners.map(listener => listener());
  }

  createNode(nodeInfo) {
    nodeInfo.options = nodeInfo.options || {};
    var node;
    if(nodeInfo.type.slice(0, 4) == 'NIN.') {
      node = new NIN[nodeInfo.type.slice(4)](nodeInfo.id, nodeInfo.options);
    } else {
      node = new window[nodeInfo.type](nodeInfo.id, nodeInfo.options);
    }
    return node;
  }

  insertOrReplaceNode(node) {
    if(this.nodes[node.id]) {
      for(var key in this.nodes[node.id].inputs) {
        if(this.nodes[node.id].inputs[key].source) {
          node.inputs[key].source = this.nodes[node.id].inputs[key].source;
          node.inputs[key].source.destination = node.inputs[key];
        }
      }
      for(var key in this.nodes[node.id].outputs) {
        if(this.nodes[node.id].outputs[key].destination) {
          node.outputs[key].destination = this.nodes[node.id].outputs[key].destination;
          node.outputs[key].destination.source = node.outputs[key];
        }
      }
    }
    this.nodes[node.id] = node;
    this.fireGraphChange();
  }

  connect(fromNodeId, outputName, toNodeId, inputName) {
    this.nodes[fromNodeId].outputs[outputName].destination =
      this.nodes[toNodeId].inputs[inputName];
    this.nodes[toNodeId].inputs[inputName].source =
      this.nodes[fromNodeId].outputs[outputName];
    this.fireGraphChange();
  }

  resize() {
    for(var key in this.nodes) {
      this.nodes[key].resize(); 
    }
  }

  traverseNodeGraphPostOrderDfs(node, fn, visitedSet={}) {
    if(node.id in visitedSet) {
      return;
    }
    visitedSet[node.id] = true;
    for(var key in node.inputs) {
      var input = node.inputs[key];
      if(input.source && input.enabled) {
        this.traverseNodeGraphPostOrderDfs(
            input.source.node,
            fn,
            visitedSet);
      }
    }
    fn(node);
  }

  update(frame) {
    if(!this.nodes.root) {
      return;
    }

    for(var key in this.nodes) {
      this.nodes[key].oldActive = this.nodes[key].active;
      this.nodes[key].active = false;
    }

    this.traverseNodeGraphPostOrderDfs(this.nodes.root, function(node) {
      node.active = true;
      node.update(frame);
    });

    for(var key in this.nodes) {
      if(this.nodes[key].oldActive != this.nodes[key].active) {
        this.fireGraphChange();
        break;
      }
    }
  }

  render(renderer) {
    if(!this.nodes.root) {
      return;
    }
    var clearColorBuffer = true;
    var clearDepthBuffer = true;
    var clearStencilBuffer = true;
    renderer.clear(clearColorBuffer, clearDepthBuffer, clearStencilBuffer);
    this.traverseNodeGraphPostOrderDfs(this.nodes.root, function(node) {
      node.render(renderer);
    });
  }

  reset() {
  }

  hardReset() {
  }

  warmup() {
  }

  jumpToFrame() {
  }

  refresh() {
  }
}
