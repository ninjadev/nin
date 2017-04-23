const React = require('react');
const e = React.createElement;


class Connection extends React.Component {
  constructor() {
    super();
    this.state = {
      showDeleteButton: true
    };
  }

  delete() {
    this.props.editor.removeConnection(
      this.props.fromPath,
      this.props.toPath,);
  }

  render() {
    const dX = this.props.connection.to.x - this.props.connection.from.x;
    const dY = this.props.connection.to.y - this.props.connection.from.y;
    const midX = this.props.connection.from.x + dX / 2;
    const midY = this.props.connection.from.y + dY / 2;
    const intensity = Math.abs(Math.cos(Math.atan(dX/dY)));
    const attributes = {
      d: `M${this.props.connection.from.x} ${this.props.connection.from.y} Q${this.props.connection.from.x + dX / 2 * intensity } ${this.props.connection.from.y} ${midX} ${midY} T${this.props.connection.to.x} ${this.props.connection.to.y}`,
      stroke: this.props.connection.active ? 'white' : '#7a8185',
      strokeWidth: this.props.connection.active ? 5 / this.props.scale : 1 / this.props.scale,
      fill: 'transparent',
      style: {
        pointerEvents: 'none',
      }
    };
    if(!this.props.connection.active) {
      attributes.strokeDasharray = '20, 10';
    }
    return e('g', {}, e('path', attributes));
  }
}

module.exports = Connection;
