const GraphEditorNode = require('./GraphEditorNode');
const Connection = require('./Connection');
const React = require('react');
const e = React.createElement;

class GraphEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      scale: 1,
      x: 0,
      y: 0,
      connectionStart: null,
      connectionEnd: {},
    };

    this.currentConnector = null;

    this.dragCoastSpeed = {
      x: 0,
      y: 0,
    };

    this.dragStartCoordinates = {
      x: 0,
      y: 0,
    };
    this.lastDragEventTime = performance.now();
    this.pinchZoomDistance = 0;
    this.isMouseDragging = false;

  }

  startOrCompleteConnection(outputOrInput) {
    if(this.state.connectionStart) {
      this.completeConnection(outputOrInput);
    } else {
      this.startConnection(outputOrInput);
    }
  }

  completeConnection(outputOrInput) {
    let fromNode;
    let fromNodeName;
    let outputName;
    let toNodeName;
    let toNode;
    let inputName;
    for(let key in outputOrInput.node.outputs) {
      if(outputOrInput == outputOrInput.node.outputs[key]) {
        fromNode = outputOrInput.node;
        outputName = key;
        break;
      }
    }
    for(let key in outputOrInput.node.inputs) {
      if(outputOrInput == outputOrInput.node.inputs[key]) {
        toNode = outputOrInput.node;
        inputName = key;
        break;
      }
    }
    for(let key in this.currentConnector.node.outputs) {
      if(this.currentConnector == this.currentConnector.node.outputs[key]) {
        fromNode = this.currentConnector.node;
        outputName = key;
        break;
      }
    }
    for(let key in this.currentConnector.node.inputs) {
      if(this.currentConnector == this.currentConnector.node.inputs[key]) {
        toNode = this.currentConnector.node;
        inputName = key;
      }
    }
    let fromNodeInfo;
    for(let i = 0; i < this.props.graph.length; i++) {
      let nodeInfo = this.props.graph[i];
      if(this.props.nodes[nodeInfo.id] == fromNode) {
        fromNodeName = nodeInfo.id;
        fromNodeInfo = nodeInfo;
      }
      if(this.props.nodes[nodeInfo.id] == toNode) {
        toNodeName = nodeInfo.id;
      }
    }
    console.log('connect', fromNode, toNode, fromNodeName, outputName, toNodeName, inputName);
    this.props.demo.nm.connect(fromNodeName, outputName, toNodeName, inputName);
    fromNodeInfo.connectedTo[outputName] = `${toNodeName}.${inputName}`;
    this.setState({
      connectionStart: null,
    });
    this.currentConnector = null;
    console.log('el completorama');
  }

  startConnection(outputOrInput) {
    this.currentConnector = outputOrInput;
    let coordinates;
    for(let key in outputOrInput.node.outputs) {
      if(outputOrInput == outputOrInput.node.outputs[key]) {
        coordinates = GraphEditorNode.getCoordinatesForOutput(outputOrInput.node, key);
        break;
      }
    }
    for(let key in outputOrInput.node.inputs) {
      if(outputOrInput == outputOrInput.node.inputs[key]) {
        coordinates = GraphEditorNode.getCoordinatesForInput(outputOrInput.node, key);
      }
    }
    let nodeInfo;
    for(let i = 0; i < this.props.graph.length; i++) {
      if(this.props.nodes[this.props.graph[i].id] == outputOrInput.node) {
        nodeInfo = this.props.graph[i];
        break;
      }
    }
    this.setState({
      connectionStart: {
        x: nodeInfo.x + coordinates.x,
        y: nodeInfo.y + coordinates.y,
      }
    });
  }

  removeConnection(output, input) {
    const fromNodeName = output.split('.')[0];
    const outputName = output.split('.')[1];
    const toNodeName = input.split('.')[0];
    const inputName = input.split('.')[1];
    for(let i = 0; i < this.props.graph.length; i++) {
      const nodeInfo = this.props.graph[i];
      if(nodeInfo.id == fromNodeName && outputName in nodeInfo.connectedTo) {
        delete nodeInfo.connectedTo[outputName];
        this.props.demo.nm.disconnect(fromNodeName, outputName, toNodeName, inputName);
        //this.forceUpdate();
        break;
      }
    }
  }

  generateDepths() {
    let deepestLevel = 0;
    let depths = {};
    let seen = new Set();

    function recurse(level, currentNodes) {
      let nextLevel = [];
      deepestLevel = Math.max(deepestLevel, level);

      for (let i = 0; i<currentNodes.length; i++) {
        let node = currentNodes[i];
        seen.add(node.id);
        depths[node.id] = {
          x: level,
          y: i
        };

        for (let child in node.inputs) {
          let source = node.inputs[child].source;
          if (source && !seen.has(source.node.id)) {
            seen.add(source.node.id);
            nextLevel.push(source.node);
          }
        }
      }

      if (nextLevel.length) {
        recurse(level + 1, nextLevel);
      }
    }

    recurse(0, [this.props.nodes.root]);

    let offset = 0;
    for (let nodeId in this.props.nodes) {
      if (depths[nodeId] === undefined) {
        depths[nodeId] = {
          x: deepestLevel + 1,
          y: offset
        };

        offset += 1;
      }
    }
    return depths;
  }

  reflowGraphLayout() {
    let depths = this.generateDepths();
    for(let i = 0; i < this.props.graph.length; i++) {
      const id = this.props.graph[i].id;
      this.props.graph[i].x = depths[id].x * -250;
      this.props.graph[i].y = depths[id].y * -100;
    }
    this.forceUpdate();
    console.log('reflowGraphLayout');
  }

  componentWillReceiveProps(nextProps) {
    setTimeout(() => this.reflowGraphLayout(), 0);  // eslint-disable-line angular/timeout-service
  }

  coastLoop() {
    const friction = 0.015;
    const deceleration = 9.81 * 39.37 * 160 * friction / 2000;
    if(this.isCoasting) {
      requestAnimationFrame(() => this.coastLoop());
    }
    this.dragCoastSpeed.x -= Math.sign(this.dragCoastSpeed.x) * deceleration;
    this.dragCoastSpeed.y -= Math.sign(this.dragCoastSpeed.y) * deceleration;
    if(Math.abs(this.dragCoastSpeed.x) <= deceleration) {
      this.dragCoastSpeed.x = 0;
    }
    if(Math.abs(this.dragCoastSpeed.y) <= deceleration) {
      this.dragCoastSpeed.y = 0;
    }
    if(this.dragCoastSpeed.x == 0 && this.dragCoastSpeed.y == 0) {
      this.isCoasting = false;
    }
    this.setState({
      x: this.state.x + this.dragCoastSpeed.x,
      y: this.state.y + this.dragCoastSpeed.y,
    });
  }

  dragStart(x, y) {
    this.dragStartCoordinates.x = x;
    this.dragStartCoordinates.y = y;
    this.dragCoastSpeed.x = 0;
    this.dragCoastSpeed.y = 0;
    this.lastDragEventTime = performance.now();
    this.isCoasting = false;
  }

  dragMove(x, y) {
    let xDelta = x - this.dragStartCoordinates.x;
    let yDelta = y - this.dragStartCoordinates.y;
    this.setState({
      x: this.state.x + xDelta,
      y: this.state.y + yDelta,
    });
    const newLastDragEventTime = performance.now();
    const timeDelta = newLastDragEventTime - this.lastDragEventTime;
    this.dragCoastSpeed.x = Math.max(-50, Math.min(50, xDelta / timeDelta * 1000 / 60));
    this.dragCoastSpeed.y = Math.max(-50, Math.min(50, yDelta / timeDelta * 1000 / 60));
    this.lastDragEventTime = newLastDragEventTime;
    this.dragStartCoordinates.x = x;
    this.dragStartCoordinates.y = y;
  }

  dragEnd(x, y) {
    this.isCoasting = true;
    requestAnimationFrame(() => this.coastLoop());
    if(Math.abs(this.dragCoastSpeed.x) < 0.1) {
      this.dragCoastSpeed.x = 0;
    }
    if(Math.abs(this.dragCoastSpeed.y) < 0.1) {
      this.dragCoastSpeed.y = 0;
    }
  }

  componentDidMount() {
    window.addEventListener('wheel', event => this.onWheel(event));
    let add = (a, b) => a + b;
    let get = key => item => item[key];
    let sum = reducable => [].reduce.call(reducable, add, 0);
    setTimeout(() => {  // eslint-disable-line angular/timeout-service
      this.container.addEventListener('touchstart', event => {
        let x = sum([].map.call(event.touches, get('pageX'))) / event.touches.length;
        let y = sum([].map.call(event.touches, get('pageY'))) / event.touches.length;
        this.dragStart(x, y);
        if(event.touches.length == 2) {
          let xDelta = event.touches[0].pageX - event.touches[1].pageX;
          let yDelta = event.touches[0].pageY - event.touches[1].pageY;
          this.pinchZoomDistance = Math.sqrt(xDelta * xDelta + yDelta * yDelta);
        }
      });
      this.container.addEventListener('touchmove', event => {
        event.preventDefault();
        let x = sum([].map.call(event.touches, get('pageX'))) / event.touches.length;
        let y = sum([].map.call(event.touches, get('pageY'))) / event.touches.length;
        this.dragMove(x, y);
        if(event.touches.length == 2) {
          let xDelta = event.touches[0].pageX - event.touches[1].pageX;
          let yDelta = event.touches[0].pageY - event.touches[1].pageY;
          let newPinchZoomDistance = Math.sqrt(xDelta * xDelta + yDelta * yDelta);
          this.zoom(this.state.scale * newPinchZoomDistance / this.pinchZoomDistance, x, y);
          this.pinchZoomDistance = newPinchZoomDistance;
        }
      });
      this.container.addEventListener('touchend', event => {
        if(event.touches.length == 0) {
          let x = sum([].map.call(event.touches, get('pageX'))) / event.touches.length;
          let y = sum([].map.call(event.touches, get('pageY'))) / event.touches.length;
          this.dragEnd(x, y);
        }
      });
      this.container.addEventListener('mousedown', event => {
        this.dragStart(event.offsetX, event.offsetY);
        this.isMouseDragging = true;
      });
      this.container.addEventListener('mouseup', event => {
        this.isMouseDragging = false;
        this.dragEnd(event.offsetX, event.offsetY);
      });
      this.container.addEventListener('mousemove', event => {
        if(this.state.connectionStart) {
          this.setState({
            connectionEnd: {
              x: event.offsetX - this.state.x,
              y: event.offsetY - this.state.y,
            }
          });
        }
        if(this.isMouseDragging) {
          this.dragMove(event.offsetX, event.offsetY);
        }
      });
    }, 1000);
  }

  zoom(scale, originX, originY) {
    const scaleDelta = scale / this.state.scale;
    const x = this.state.x;
    const y = this.state.y;

    this.setState({
      scale: scale,
      x: scaleDelta * (x - originX) + originX,
      y: scaleDelta * (y - originY) + originY,
    });
  }

  onWheel(event) {
    const wheel = event.deltaY / 120;
    const scale = Math.max(1, this.state.scale * (1 - wheel));
    this.zoom(scale, event.offsetX, event.offsetY);
  }

  render() {
    if(!this.props.graph) {
      return e('svg');
    }
    const graphEditorNodes = this.props.graph.map((nodeInfo, i) =>
      e(GraphEditorNode, {
        nodeInfo,
        key: nodeInfo.id,
        scale: this.state.scale,
        node: this.props.nodes[nodeInfo.id],
        x: nodeInfo.x,
        y: nodeInfo.y,
        demo: this.props.demo,
        editor: this,
      }));

    const connections = [];
    for(let i = 0; i < this.props.graph.length; i++) {
      let nodeInfo = this.props.graph[i];
      for(let fromIOId in nodeInfo.connectedTo) {
        let toNodeId = nodeInfo.connectedTo[fromIOId].split('.')[0];
        let toIOId = nodeInfo.connectedTo[fromIOId].split('.')[1];
        let outputCoordinates = GraphEditorNode.getCoordinatesForOutput(
          this.props.nodes[nodeInfo.id].outputs[fromIOId].node, fromIOId);
        let inputCoordinates = GraphEditorNode.getCoordinatesForInput(
          this.props.nodes[toNodeId].inputs[toIOId].node, toIOId);
        outputCoordinates.x += nodeInfo.x;
        outputCoordinates.y += nodeInfo.y;
        let toNodeInfo;
        for(let j = 0; j < this.props.graph.length; j++) {
          if(this.props.graph[j].id == toNodeId) {
            toNodeInfo = this.props.graph[j];
            break;
          }
        }
        inputCoordinates.x += toNodeInfo.x;
        inputCoordinates.y += toNodeInfo.y;
        connections.push({
          from: outputCoordinates,
          to: inputCoordinates,
          key: `${nodeInfo.id}.${fromIOId}|${toNodeId}.${toIOId}`
        });
      }
    }

    if(this.state.connectionStart) {
      connections.push({
        from: this.state.connectionStart,
        to: this.state.connectionEnd,
        key: `temporary`
      });
    }

    return e('div', {ref: ref => this.container = ref}, e('svg',
      {height: 99999, width: 99999},
      e('g', {
        transform: `matrix(${this.state.scale},0,0,${this.state.scale},${this.state.x},${this.state.y})`,
      }, graphEditorNodes,
      connections.map(connection => e(Connection, {connection, fromPath: connection.key.split('|')[0], toPath: connection.key.split('|')[1], editor: this, scale: this.state.scale, key: connection.key})),
      )));
  }
}

module.exports = GraphEditor;
