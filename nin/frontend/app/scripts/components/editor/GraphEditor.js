const GraphEditorNode = require('./GraphEditorNode');
const Connection = require('./Connection');
const React = require('react');
const e = React.createElement;

class GraphEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      scale: 1.5,
      x: 0,
      y: 0,
      connectionStart: null,
      connectionEnd: {},
    };

    this.scaleAnimationStart = this.state.scale;
    this.scaleAnimationEnd = this.state.scale;
    this.scaleAnimationStartTime = 0;
    this.scaleAnimationEndTime = 0;
    this.scaleAnimationX = 0;
    this.scaleAnimationY = 0;
    this.time = 0;

    this.loop = time => {
      this.time = time;
      this.forceUpdate();
      if(this.state.scale != this.scaleAnimationEnd) {
        this.zoom(
          smoothstep(
            this.scaleAnimationStart,
            this.scaleAnimationEnd,
            ((time - this.scaleAnimationStartTime) /
             (this.scaleAnimationEndTime -
              this.scaleAnimationStartTime))),
          this.scaleAnimationX,
          this.scaleAnimationY);
      }
      requestAnimationFrame(this.loop);
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
    this.inspectedItem = null;
  }

  inspect(item) {
    if(this.inspectedItem) {
      this.inspectedItem.__isInspected = false;
      const value = this.inspectedItem.getValue();
      if(value == demo.renderer.overrideToScreenTexture) {
        demo.renderer.overrideToScreenTexture = null;
      }
      if(item == this.inspectedItem) {
        item = null;
      }
    }
    this.inspectedItem = item;
    if(item) {
      item.__isInspected = true;
    }
  }

  generateDepths() {
    let deepestLevel = 0;
    let depths = {};

    depths.root = {
      x: 0,
      y: 0,
      id: 'root',
      counter: 0,
    };

    let counter = 1;

    function recurse(level, currentNodes) {
      let nextLevel = [];
      deepestLevel = Math.max(deepestLevel, level);

      for (let i = 0; i < currentNodes.length; i++) {
        let node = currentNodes[i];

        for (let child in node.inputs) {
          let source = node.inputs[child].source;
          if(source) {
            depths[source.node.id] = {
              x: level + 1,
              y: 0,
              id: source.node.id,
              counter
            };
            counter++;
            nextLevel.push(source.node);
          }
        }
      }

      if (nextLevel.length) {
        recurse(level + 1, nextLevel);
      }
    }

    recurse(0, [this.props.nodes.root]);

    const positions = [];
    for(let i = 0; i <= deepestLevel; i++) {
      positions[i] = [];
    }
    for(let nodeId in depths) {
      positions[depths[nodeId].x].push(depths[nodeId]);
    }

    for(let x in positions) {
      for(let y in positions[x]) {
        const depth = positions[x][y];
        depths[depth.id].y = positions[x].length / 2 - y;
      }
    }

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
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.graph) {
      setTimeout(() => this.reflowGraphLayout(), 0);
    }
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
    requestAnimationFrame(this.loop);
    window.addEventListener('wheel', event => this.onWheel(event));
    let add = (a, b) => a + b;
    let get = key => item => item[key];
    let sum = reducable => [].reduce.call(reducable, add, 0);
    setTimeout(() => {
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
    const scale = Math.max(0.5, this.state.scale * (1 - wheel));
    this.scaleAnimationStart = this.state.scale;
    this.scaleAnimationEnd = scale;
    this.scaleAnimationStartTime = this.time;
    this.scaleAnimationEndTime = this.time + 100;
    this.scaleAnimationX = event.offsetX;
    this.scaleAnimationY = event.offsetY;
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
      let toNodeInfo = nodeInfo;
      for(let toIOId in nodeInfo.connected) {
        let fromNodeId = nodeInfo.connected[toIOId].split('.')[0];
        let toNodeId = toNodeInfo.id;
        let fromIOId = nodeInfo.connected[toIOId].split('.')[1];
        let outputCoordinates = GraphEditorNode.getCoordinatesForOutput(
          this.props.nodes[fromNodeId].outputs[fromIOId].node, fromIOId);
        let inputCoordinates = GraphEditorNode.getCoordinatesForInput(
          this.props.nodes[toNodeId].inputs[toIOId].node, toIOId);
        let fromNodeInfo;
        for(let j = 0; j < this.props.graph.length; j++) {
          if(this.props.graph[j].id == fromNodeId) {
            fromNodeInfo = this.props.graph[j];
            break;
          }
        }
        outputCoordinates.x += fromNodeInfo.x;
        outputCoordinates.y += fromNodeInfo.y;
        inputCoordinates.x += toNodeInfo.x;
        inputCoordinates.y += toNodeInfo.y;
        connections.push({
          from: outputCoordinates,
          to: inputCoordinates,
          active: (this.props.nodes[fromNodeId].active &&
                   this.props.nodes[toNodeId].active),
          key: `${fromNodeId}.${fromIOId}|${toNodeId}.${toIOId}`
        });
      }
    }

    if(this.inspectedItem) {
      const value = this.inspectedItem.getValue();
      if(value instanceof THREE.Texture) {
        demo.renderer.overrideToScreenTexture = value;
      }
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
