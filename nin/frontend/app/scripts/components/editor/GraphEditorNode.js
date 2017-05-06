const GraphEditorInputOutput = require('./GraphEditorInputOutput');
const FlyaroundController = require('./FlyaroundController');
const React = require('react');
const e = React.createElement;

class GraphEditorNode extends React.Component {

  constructor(props) {
    super(props);

    this.flyaroundController = null;
    this.startFlyControl = () => {
      if (!this.flyaroundController) {
        this.flyaroundController = new FlyaroundController(this.props.node);
      } else {
        this.flyaroundController.toggleFlyAroundMode();
      }
    };
  }

  static getYCoordinateForIO(node, key) {
  }

  static getCoordinatesForInput(node, key) {
    const numberOfInputs = node.inputs ? Object.keys(node.inputs).length : 0;
    const numberOfOutputs = node.outputs ? Object.keys(node.outputs).length : 0;
    const heightPerInputOrOutput = 20;
    const padding = 10;
    const height = Math.max(numberOfInputs, numberOfOutputs) * heightPerInputOrOutput + padding * 2;
    const keys = Object.keys(node.inputs);
    keys.sort();
    const i = keys.indexOf(key);
    return {
      x: padding + heightPerInputOrOutput / 2,
      y: height / 2 + (numberOfInputs == 1 ? 0 : (i - (numberOfInputs - 1) / 2) * heightPerInputOrOutput),
    };
  }

  static getCoordinatesForOutput(node, key) {
    const width = 200;
    const numberOfInputs = node.inputs ? Object.keys(node.inputs).length : 0;
    const numberOfOutputs = node.outputs ? Object.keys(node.outputs).length : 0;
    const heightPerInputOrOutput = 20;
    const padding = 10;
    const height = Math.max(numberOfInputs, numberOfOutputs) * heightPerInputOrOutput + padding * 2;
    const keys = Object.keys(node.outputs);
    keys.sort();
    const i = keys.indexOf(key);
    return {
      x: width - padding - heightPerInputOrOutput / 2,
      y: height / 2 + (numberOfOutputs == 1 ? 0 : (i - (numberOfOutputs - 1) / 2) * heightPerInputOrOutput),
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.node !== this.props.node) {
      if (this.flyaroundController) {
        this.flyaroundController.updateNodeInstance(nextProps.node);
        if (this.props.node.camera.isOverriddenByFlyControls) {
          const cameraCopy = this.props.node.camera.clone();
          setTimeout(() => {
            nextProps.node.camera.copy(cameraCopy);
          });
          this.flyaroundController.toggleFlyAroundMode();
        }
      }
    }
  }

  render() {
    const node = this.props.node;
    const width = 200;
    const numberOfInputs = node.inputs ? Object.keys(node.inputs).length : 0;
    const numberOfOutputs = node.outputs ? Object.keys(node.outputs).length : 0;
    const heightPerInputOrOutput = 20;
    const padding = 10;
    const height = Math.max(numberOfInputs, numberOfOutputs) * heightPerInputOrOutput + padding * 2;

    return e('g', {
      className: 'node',
      transform: `translate(${this.props.x},${this.props.y})`,
      style: {
        opacity: 0.5 + 0.5 * node.active
      }
    },
      e('rect', {
        className: 'background',
        x: 0,
        y: 0,
        width,
        height
      }),
      Object.keys(node.inputs).map(key => e(GraphEditorInputOutput, {
        item: this.props.node.inputs[key],
        x: GraphEditorNode.getCoordinatesForInput(node, key).x,
        y: GraphEditorNode.getCoordinatesForInput(node, key).y,
        key: key,
        id: key,
        scale: this.props.scale,
        demo: this.props.demo,
        editor: this.props.editor,
      })),
      Object.keys(node.outputs).map((key, i) => e(GraphEditorInputOutput, {
        item: node.outputs[key],
        x: GraphEditorNode.getCoordinatesForOutput(node, key).x,
        y: GraphEditorNode.getCoordinatesForOutput(node, key).y,
        key: key,
        id: key,
        scale: this.props.scale,
        demo: this.props.demo,
        editor: this.props.editor,
      })),
      e('text', {
        className: 'name',
        x: 0,
        y: 0,
        transform: `translate(${width / 2}, ${height / 2})`,
      }, this.props.nodeInfo.id),
      this.props.scale >= 1.5 ? e('text', {
        x: 0,
        y: 0,
        className: 'monospaced',
        transform: `translate(${width / 2}, ${height / 2 + 11}) scale(0.3)`,
      }, this.props.nodeInfo.type) : null,
      node.constructor.prototype instanceof NIN.THREENode ? e('text', {
        x: 0,
        y: 0,
        className: 'start-fly-around',
        transform: `translate(${width / 2}, ${height / 2 - 11}) scale(0.3)`,
        onClick: this.startFlyControl,
      }, node.camera.isOverriddenByFlyControls ? 'Exit fly-around mode' : 'Start fly-around mode') : null,
    );
  }
}

module.exports = GraphEditorNode;
