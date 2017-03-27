const React = require('react');
const e = React.createElement;


class GraphEditorInputOutput extends React.Component {

  render() {
    let valueType;
    if(this.props.item) {
      const value = this.props.item.getValue();
      if(value && value.constructor) {
        valueType = value.constructor.name;
      } else {
        valueType = typeof value;
      }
    }
    const isConnected = !!(this.props.item.destination || this.props.item.source);
    return e('g', {
      transform: `translate(${this.props.x}, ${this.props.y}) scale(${1 / this.props.scale})`
    },
      e('rect', {
        fill: 'transparent',
        stroke: 'transparent',
        x: -10 * this.props.scale,
        y: -10 * this.props.scale,
        width: 20 * this.props.scale,
        height: 20 * this.props.scale,
      }),
      e('circle', {
        cx: 0,
        cy: 0,
        r: this.props.item.__isInspected ? 10 : 5,
        fill: isConnected ? 'white' : 'transparent',
        stroke: this.props.item.__isInspected ? 'orange' : 'white',
        strokeWidth: this.props.item.__isInspected ? 5 : 2,
        style: {
          cursor: 'pointer',
        },
        onClick: event => {this.props.editor.inspect(this.props.item);},
      }),
      this.props.scale >= 1.5 ? e('text', {
        x: 0,
        y: 10 * this.props.scale,
      }, this.props.id) : null,
      this.props.scale >= 3 ? e('text', {
        x: 0,
        y: 15 * this.props.scale,
      }, valueType) : null);
  }
}

module.exports = GraphEditorInputOutput;
