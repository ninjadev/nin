class NodeManager {
  constructor() {
    this.nodes = {};
    this.graphChangeListeners = [];
  }

  fireEvent(type) {
    if(type === 'graphchange') {
      for(let listener of this.graphChangeListeners) {
        listener();
      }
    }
  }

  addEventListener(type, listener) {
    if(type !== 'graphchange') {
      throw Error('Unsopported type');
    }
    this.graphChangeListeners.push(listener);
  }

  createNode(nodeInfo) {
    const deepClonedNodeInfo = JSON.parse(JSON.stringify(nodeInfo));
    deepClonedNodeInfo.options = deepClonedNodeInfo.options || {};

    const nodeConstructor = deepClonedNodeInfo.type.slice(0, 4) === 'NIN.' ?
      NIN[deepClonedNodeInfo.type.slice(4)]
      : window[deepClonedNodeInfo.type];

    if (nodeConstructor === undefined) {
      return null;
    }

    return new nodeConstructor(deepClonedNodeInfo.id, deepClonedNodeInfo.options);
  }

  insertOrReplaceNode(node) {
    const nodeToReplace = this.nodes[node.id];
    if(nodeToReplace) {
      for(let inputKey in nodeToReplace.inputs) {
        const input = nodeToReplace.inputs[inputKey];
        if(input.source) {
          node.inputs[inputKey].source = input.source;
        }
      }
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
    this.fireEvent('graphchange');
  }

  connect(fromNodeId, outputName, toNodeId, inputName) {
    this.nodes[toNodeId].inputs[inputName].source =
      this.nodes[fromNodeId].outputs[outputName];
    this.fireEvent('graphchange');
  }

  disconnect(fromNodeId, outputName, toNodeId, inputName) {
    this.nodes[toNodeId].inputs[inputName].source = null;
    this.fireEvent('graphchange');
  }

  resize() {
    for(var key in this.nodes) {
      this.nodes[key].resize(); 
    }
  }

  traverseNodeGraphPostOrderDfs(node, fn, fullTraversal=false, visitedSet={}) {
    if(node.id in visitedSet) {
      return;
    }
    visitedSet[node.id] = true;
    for(var key in node.inputs) {
      var input = node.inputs[key];
      if(input.source && (fullTraversal || input.enabled)) {
        this.traverseNodeGraphPostOrderDfs(
            input.source.node,
            fn,
            fullTraversal,
            visitedSet);
      }
    }
    fn(node);
  }

  beforeUpdate(frame) {
    if(!this.nodes.root) {
      return;
    }
    this.traverseNodeGraphPostOrderDfs(this.nodes.root, node => {
      node.beforeUpdate(frame);
    }, true);
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
    renderer.clear(true, true, true);
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
