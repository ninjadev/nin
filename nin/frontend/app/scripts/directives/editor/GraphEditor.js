const GraphEditorNode = require('./GraphEditorNode');
const React = require('react');
const e = React.createElement;

class GraphEditor extends React.Component {
  constructor() {
    super();
    this.state = {
      scale: 1,
      x: 0,
      y: 0,
    };

    this.mouseDownCoordinates = {
      x: 0,
      y: 0,
    };
    this.startDragCoordinates = {
      x: 0,
      y: 0,
    };
    this.isDragging = false;
  }

  componentDidMount() {
    window.addEventListener('wheel', event => this.onWheel(event));
    setTimeout(() => {
      this.container.addEventListener('touchstart', event => {
        if(event.touches.length == 1) {
          this.mouseDownCoordinates.x = event.touches[0].pageX;
          this.mouseDownCoordinates.y = event.touches[0].pageY;
          this.startDragCoordinates.x = this.state.x;
          this.startDragCoordinates.y = this.state.y;
        }
      });
      this.container.addEventListener('mousedown', event => {
        this.mouseDownCoordinates.x = event.offsetX;
        this.mouseDownCoordinates.y = event.offsetY;
        this.startDragCoordinates.x = this.state.x;
        this.startDragCoordinates.y = this.state.y;
        this.isDragging = true;
      });
      this.container.addEventListener('touchmove', event => {
        event.preventDefault();
        this.setState({
          x: this.startDragCoordinates.x + event.touches[0].pageX - this.mouseDownCoordinates.x,
          y: this.startDragCoordinates.y + event.touches[0].pageY - this.mouseDownCoordinates.y,
        });
      });
      this.container.addEventListener('mouseup', event => {
        this.isDragging = false;
      });
      this.container.addEventListener('mousemove', event => {
        if(!this.isDragging) {
          return;
        }
        this.setState({
          x: this.startDragCoordinates.x + event.offsetX - this.mouseDownCoordinates.x,
          y: this.startDragCoordinates.y + event.offsetY - this.mouseDownCoordinates.y,
        });
      });
      this.container.addEventListener('mouseup', event => {
        this.isDragging = false;
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
    const scale = Math.max(1, this.state.scale * (1 + wheel));
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
        y: i * 100,
      }));
    return e('div', {ref: ref => this.container = ref}, e('svg',
      {height: 99999, width: 99999},
      e('g', {
        transform: `matrix(${this.state.scale},0,0,${this.state.scale},${this.state.x},${this.state.y})`,
      }, graphEditorNodes)));
  }
}

module.exports = GraphEditor;
