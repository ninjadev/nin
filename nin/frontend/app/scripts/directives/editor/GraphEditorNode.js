const GraphEditorInputOutput = require('./GraphEditorInputOutput');
const React = require('react');
const e = React.createElement;

class GraphEditorNode extends React.Component {
  render() {
    const node = this.props.node;
    const numberOfInputs = Object.keys(node.inputs).length;
    const numberOfOutputs = Object.keys(node.outputs).length;
    const heightPerInputOrOutput = 20;
    const padding = 10;
    const height = Math.max(numberOfInputs, numberOfOutputs) * heightPerInputOrOutput + padding * 2;
    const width = 200;

    return e('g', {
      className: 'node',
      transform: `translate(0,${this.props.y})`,
    },
      e('rect', {
        className: 'background',
        x: 0,
        y: 0,
        width,
        height
      }),
      Object.keys(node.inputs).map((key, i) => e(GraphEditorInputOutput, {
        item: node.inputs[key],
        x: padding + heightPerInputOrOutput / 2,
        y: height / 2 + (numberOfInputs == 1 ? 0 : (i - (numberOfInputs - 1) / 2) * heightPerInputOrOutput),
        key: key,
        id: key,
        scale: this.props.scale,
      })),
      Object.keys(node.outputs).map((key, i) => e(GraphEditorInputOutput, {
        item: node.outputs[key],
        x: width - padding - heightPerInputOrOutput / 2,
        y: height / 2 + (numberOfOutputs == 1 ? 0 : (i - (numberOfOutputs - 1) / 2) * heightPerInputOrOutput),
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
