const React = require('react');
const e = React.createElement;


class Connection extends React.Component {
  constructor() {
    super();
    this.state = {
      showDeleteButton: false
    };
  }

  onMouseOver(event) {
    this.setState({
      showDeleteButton: true,
    });
  }

  onMouseOut(event) {
    this.setState({
      showDeleteButton: false,
    });
  }

  delete() {
    alert('deleted');
  }

  render() {
    const dX = this.props.connection.to.x - this.props.connection.from.x;
    const dY = this.props.connection.to.y - this.props.connection.from.y;
    const midX = this.props.connection.from.x + dX / 2;
    const midY = this.props.connection.from.y + dY / 2;
    const intensity = Math.abs(Math.cos(Math.atan(dX/dY)));
    return e('g', {
      onMouseOver: event => this.onMouseOver(event),
      onMouseOut: event => this.onMouseOut(event),
      }, e('path', {
        d: `M${this.props.connection.from.x} ${this.props.connection.from.y} Q${this.props.connection.from.x + dX / 2 * intensity } ${this.props.connection.from.y} ${midX} ${midY} T${this.props.connection.to.x} ${this.props.connection.to.y}`,
        stroke: 'white',
        strokeWidth: 5 / this.props.scale,
        fill: 'transparent',
      }),
      this.state.showDeleteButton ? e('circle', {
        className: 'delete-button',
        cx: midX,
        cy: midY,
        r: 10 / this.props.scale,
      }) : null,
      this.state.showDeleteButton ? e('text', {
        className: 'delete-button',
        x: 0,
        y: 0,
        transform: `translate(${midX}, ${midY}) scale(${1 / this.props.scale})`,
      }, '⨯') : null,
    );
  }
}

module.exports = Connection;
