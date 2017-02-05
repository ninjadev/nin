const GraphEditorInputOutput = require('./GraphEditorInputOutput');
const React = require('react');
const e = React.createElement;

class GraphEditorNode extends React.Component {

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
    },
      e('rect', {
        className: 'background',
        x: 0,
        y: 0,
        width,
        height
      }),
      Object.keys(node.inputs).map(key => e(GraphEditorInputOutput, {
        item: node.inputs[key],
        x: GraphEditorNode.getCoordinatesForInput(node, key).x,
        y: GraphEditorNode.getCoordinatesForInput(node, key).y,
        key: key,
        id: key,
        scale: this.props.scale,
      })),
      Object.keys(node.outputs).map((key, i) => e(GraphEditorInputOutput, {
        item: node.outputs[key],
        x: GraphEditorNode.getCoordinatesForOutput(node, key).x,
        y: GraphEditorNode.getCoordinatesForOutput(node, key).y,
        key: key,
        id: key,
        scale: this.props.scale,
      })),
      e('text', {
        className: 'name',
        x: 0,
        y: 0,
        transform: `translate(${width / 2}, ${height / 2}) scale(${1 / this.props.scale})`,
      }, this.props.nodeInfo.id),
    );
  }
}

module.exports = GraphEditorNode;
