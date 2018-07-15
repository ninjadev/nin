const GraphEditorNode = require('./GraphEditorNode');
const Connection = require('./Connection');
const React = require('react');

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

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1000);
    this.camera.position.z = 1000;
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    this.renderer = demo.renderer;
    this.renderer.setClearColor(0, 0);
    this.renderer.sortObjects = true;
    this.renderer.autoClear = false;
    this.renderer.domElement.style = "width: 100%; height: 100%";
    this.oldContainer = undefined;
    const noop = () => undefined;

    const planeGeometry = new THREE.PlaneBufferGeometry(16, 9);

    const nameTextures = {};

    const makeNameTexture = name => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 160;
      canvas.height = 90;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.font = '16px Arial';
      ctx.fillStyle = '#1e2930';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.fillText(name, canvas.width / 2, canvas.height / 2);
      return new THREE.CanvasTexture(canvas);
    };

    this.rebuildScene = () => {
      this.reflowGraphLayout();

      /* hacky clearing */
      while(this.scene.children.length > 0) {
        this.scene.remove(this.scene.children[this.scene.children.length - 1]);
      }

      this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), new THREE.MeshBasicMaterial({
        color: 0x596267,
      }));
      this.scene.add(this.quad);

      this.display = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), new THREE.MeshBasicMaterial({
        map: this.props.demo.nm.nodes.root && this.props.demo.nm.nodes.root.inputs.screen.getValue()
      }));
      this.display.scale.x = 1 / 3;
      this.display.scale.y = 1 / 3;
      this.display.position.x = 0.5;
      this.display.position.y = 0.5;
      this.display.position.z = 20;
      this.scene.add(this.display);

      this.graphContainer = new THREE.Object3D();
      this.scene.add(this.graphContainer);
      const scale = 1 / 100;
      this.graphContainer.scale.set(scale, scale * 16 / 9, 1);

      this.graphContainer.scale.x = this.graphContainer.scale.x * this.state.scale;
      this.graphContainer.scale.y = this.graphContainer.scale.y * this.state.scale;
      this.graphContainer.scale.z = this.graphContainer.scale.z * this.state.scale;

      this.graphContainer.position.x = this.state.x / 100;
      this.graphContainer.position.y = -this.state.y / 100;

      this.graphContainer.nodeObjects = {};

      for(let nodeInfo of this.props.graph) {
        const nodeObject = new THREE.Object3D();
        this.graphContainer.nodeObjects[nodeInfo.id] = nodeObject;
        this.graphContainer.add(nodeObject);
        nameTextures[nodeInfo.id] = nameTextures[nodeInfo.id] || makeNameTexture(nodeInfo.id);
        const mesh = new THREE.Mesh(
          planeGeometry,
          new THREE.MeshBasicMaterial({
            map: nameTextures[nodeInfo.id],
          }));

        nodeObject.add(mesh);
        nodeObject.position.x = nodeInfo.x * -25;
        nodeObject.position.y = nodeInfo.y * -10;
        nodeObject.position.z = 10;

        nodeObject.outputMeshes = {};

        const node = demo.nm.nodes[nodeInfo.id];
        let i = 0;
        for(let outputName in node.outputs) {
          const outputMesh = new THREE.Mesh(
            planeGeometry,
            new THREE.MeshBasicMaterial({
              color: 0xff0000,
            }));
          nodeObject.outputMeshes[outputName] = outputMesh;
          outputMesh.position.x = 5;
          outputMesh.position.y = 3 * i;
          outputMesh.position.z = 20;
          outputMesh.scale.set(0.2, 0.2, 1);
          nodeObject.add(outputMesh);
          const output = node.outputs[outputName];
          if(output instanceof NIN.TextureOutput) {
            const potentiallyATexture = output.getValue();
            outputMesh.material.map = potentiallyATexture;
            outputMesh.material.color = new THREE.Color(1, 1, 1);
          }
          i++;
        }
      }

    };


    this.registeredListener = false;

    this.renderLoop = time => {
      if(!this.registeredListener && this.props.demo && this.props.demo.nm) {
        this.rebuildScene();
        this.props.demo.nm.addEventListener('graphchange', this.rebuildScene);
        this.registeredListener = true;
      }

      if(this.graphContainer) {
        const scale = 1 / 100;
        this.graphContainer.scale.set(scale, scale * 16 / 9, 1);
        this.graphContainer.scale.x = this.graphContainer.scale.x * this.state.scale;
        this.graphContainer.scale.y = this.graphContainer.scale.y * this.state.scale;
        this.graphContainer.scale.z = this.graphContainer.scale.z * this.state.scale;
        this.graphContainer.position.x = this.state.x / 100;
        this.graphContainer.position.y = -this.state.y / 100;
      }

      if(demo.nm.nodes.root) {
        //demo.nm.nodes.root.render = noop;
      }

      if(demo && demo.nm && demo.nm.nodes) {
        for(let nodeId in this.graphContainer.nodeObjects) {
          const nodeObject = this.graphContainer.nodeObjects[nodeId];
          const node = demo.nm.nodes[nodeId];
          for(let outputName in nodeObject.outputMeshes) {
            const outputMesh = nodeObject.outputMeshes[outputName];
            const output = node.outputs[outputName];
            if(output instanceof NIN.TextureOutput) {
              const potentiallyATexture = output.getValue();
              outputMesh.material.map = potentiallyATexture;
              outputMesh.material.color = new THREE.Color(1, 1, 1);
            }
          }
        }
      }

      if(this.display && demo && demo.nm && demo.nm.nodes && demo.nm.nodes.root) {
        this.display.material.map = demo.nm.nodes.root.inputs.screen.getValue();
      }

      this.renderer.clear(true, true, true);
      this.renderer.render(this.scene, this.camera);
    };


    const originalLoop = demo.looper.loop;
    demo.looper.loop = time => {
      originalLoop(time);
      this.renderLoop(time);
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
      const value = this.inspectedItem.props.item.getValue();
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
      this.props.graph[i].x = depths[id].x;
      this.props.graph[i].y = depths[id].y;
    }
    //this.forceUpdate();
    //this.fitGraphOnScreen();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.graph) {
      setTimeout(() => this.reflowGraphLayout(), 0);
    }
  }

  fitGraphOnScreen() {
    this.isCoasting = false;
    this.dragCoastSpeed.x = 0;
    this.dragCoastSpeed.y = 0;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    function getHeightForNode(node) {
      const numberOfInputs = node.inputs ? Object.keys(node.inputs).length : 0;
      const numberOfOutputs = node.outputs ? Object.keys(node.outputs).length : 0;
      const heightPerInputOrOutput = 20;
      const padding = 10;
      return Math.max(numberOfInputs, numberOfOutputs) * heightPerInputOrOutput + padding * 2;
    }
    for(let node of this.props.graph) {
      const width = 200;
      const height = getHeightForNode(node);
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x + width);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y + height);
    }

    const x = (maxX + minX) / 2;
    const y = (maxY + minY) / 2;
    let scale = (window.innerWidth - 50) / (maxX - minX);
    scale = Math.min(scale, (window.innerHeight - 50 * 2) / (maxY - minY));
    this.scaleAnimationStart = scale;
    this.scaleAnimationEnd = scale;
    this.setState({x: -x * scale, y: -y * scale, scale});
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
    let add = (a, b) => a + b;
    let get = key => item => item[key];
    let sum = reducable => [].reduce.call(reducable, add, 0);
    setTimeout(() => {
      this.container.addEventListener('wheel', event => this.onWheel(event));

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
    this.scaleAnimationX = event.offsetX - window.innerWidth / 2;
    this.scaleAnimationY = event.offsetY - (window.innerHeight - 50) / 2;
  }

  render() {
    if(!this.props.graph) {
      return <svg />;
    }
    const graphEditorNodes = this.props.graph.map((nodeInfo, i) =>
      <GraphEditorNode
        nodeInfo={nodeInfo}
        key={nodeInfo.id}
        scale={this.state.scale}
        node={this.props.nodes[nodeInfo.id]}
        x={nodeInfo.x}
        y={nodeInfo.y}
        demo={this.props.demo}
        editor={this}
      />);

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
      const value = this.inspectedItem.props.item.getValue();
      if(value instanceof THREE.Texture) {
        demo.renderer.overrideToScreenTexture = value;
      }
    }

    const connectionNodes = connections.map(connection =>
      <Connection
        connection={connection}
        fromPath={connection.key.split('|')[0]}
        fromPath={connection.key.split('|')[1]}
        editor={this}
        scale={this.state.scale}
        key={connection.key}
      />);

    const transform = `matrix(${this.state.scale},0,0,${this.state.scale},${this.state.x},${this.state.y})`;
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
        }}
        ref={ref => {
          this.container = ref;
          if(this.container && this.oldContainer != this.container) {
            this.oldContainer = this.container;
            demo.setContainer(this.container);
            demo.resize();
            setTimeout(() => {
              this.props.demo.start();
              this.props.demo.music.pause();
              this.props.demo.jumpToFrame(0);
            }, 0);
          }
        }}
      >
        {/*
        <svg height={window.innerHeight - 50} width={window.innerWidth}>
          <g transform={`matrix(1,0,0,1,${window.innerWidth / 2},${(window.innerHeight - 50) / 2})`}>
            <g transform={transform}>
              {graphEditorNodes}
              {connectionNodes}
            </g>
          </g>
        </svg>
        */}
      </div>);
  }
}

module.exports = GraphEditor;
