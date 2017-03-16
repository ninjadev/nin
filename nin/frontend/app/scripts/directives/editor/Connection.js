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
    return e('g', {
    }, e('path', {
      d: `M${this.props.connection.from.x} ${this.props.connection.from.y} Q${this.props.connection.from.x + dX / 2 * intensity } ${this.props.connection.from.y} ${midX} ${midY} T${this.props.connection.to.x} ${this.props.connection.to.y}`,
      stroke: 'white',
      strokeWidth: 5 / this.props.scale,
      fill: 'transparent',
      style: {
        pointerEvents: 'none',
      }
    }));
  }
}

module.exports = Connection;
