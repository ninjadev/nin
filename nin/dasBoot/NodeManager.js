class NodeManager {
  constructor() {
    this.nodes = {};
    this.graphChangeListeners = [];
  }

  createNode(nodeInfo) {
    nodeInfo.options = nodeInfo.options || {};

    const nodeConstructor = nodeInfo.type.slice(0, 4) === 'NIN.' ?
      NIN[nodeInfo.type.slice(4)]
      : window[nodeInfo.type];

    if (nodeConstructor === undefined) {
      return null;
    }

    return new nodeConstructor(nodeInfo.id, nodeInfo.options);
  }

  insertOrReplaceNode(node) {
    const nodeToReplace = this.nodes[node.id];
    if(nodeToReplace) {
      for(let key in this.nodes) {
        const currentNode = this.nodes[key];
        for(let inputKey in currentNode.inputs) {
          const input = currentNode.inputs[inputKey];
          if(input.source && input.source.node === nodeToReplace) {
            for(let k in nodeToReplace.outputs) {
              if(nodeToReplace.outputs[k] === input.source) {
                input.source = node.outputs[k];
                break;
              }
            }
          }
        }
      }
    }
    this.nodes[node.id] = node;
  }

  connect(fromNodeId, outputName, toNodeId, inputName) {
    this.nodes[fromNodeId].outputs[outputName].destination =
      this.nodes[toNodeId].inputs[inputName];
    this.nodes[toNodeId].inputs[inputName].source =
      this.nodes[fromNodeId].outputs[outputName];
  }

  disconnect(fromNodeId, outputName, toNodeId, inputName) {
    this.nodes[fromNodeId].outputs[outputName].destination = null;
    this.nodes[toNodeId].inputs[inputName].source = null;
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

  warmup(renderer) {
    for(let id in this.nodes) {
      this.nodes[id].warmup(renderer);
    }
  }

  jumpToFrame() {
  }

  refresh() {
  }
}

module.exports = NodeManager;
