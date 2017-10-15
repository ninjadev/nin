const React = require('react');
const e = React.createElement;


class Connection extends React.Component {
  constructor() {
    super();
    this.state = {
      showDeleteButton: true
    };

    this.delete = () => {
      this.props.editor.removeConnection(
        this.props.fromPath,
        this.props.toPath,);
    };
  }

  render() {
    const dX = this.props.connection.to.x - this.props.connection.from.x;
    const dY = this.props.connection.to.y - this.props.connection.from.y;
    const midX = this.props.connection.from.x + dX / 2;
    const midY = this.props.connection.from.y + dY / 2;
    const intensity = Math.abs(Math.cos(Math.atan(dX/dY)));
    const d = `M${this.props.connection.from.x} ${this.props.connection.from.y} Q${this.props.connection.from.x + dX / 2 * intensity } ${this.props.connection.from.y} ${midX} ${midY} T${this.props.connection.to.x} ${this.props.connection.to.y}`;
    return (
      <g>
        <path
          d={d}
          stroke={this.props.connection.active ? 'white' : '#7a8185'}
          strokeWidth={this.props.connection.active ? 5 / this.props.scale : 1 / this.props.scale}
          fill="transparent"
          pointerEvents="none"
          strokeDasharray={this.props.connection.active ? undefined : '20, 10'}
        />

        <circle
          className="graph-editor-line-x"
          cx={midX}
          cy={midY}
          r={10 / this.props.scale}
          onClick={this.delete}
          style={{
            cursor: 'pointer',
          }}
        >
          <circle
            cx={midX}
            cy={midY}
            r={3 / this.props.scale}
            fill="white"
          />
      </circle>
      </g>
    );
  }
}

module.exports = Connection;
