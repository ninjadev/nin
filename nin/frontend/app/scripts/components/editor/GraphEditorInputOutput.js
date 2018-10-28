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
    const isConnected = !!this.props.item.source;
    return (
      <g transform={`translate(${this.props.x}, ${this.props.y}) scale(${1 / this.props.scale})`}>
        <rect
          fill="transparent"
          stroke="transparent"
          x={-10 * this.props.scale}
          y={-10 * this.props.scale}
          width={20 * this.props.scale}
          height={20 * this.props.scale}
        />
        <circle
          cx="0"
          cy="0"
          r={this.__isInspected ? 10 : 5}
          fill={isConnected ? 'white' : 'transparent'}
          stroke={this.__isInspected ? 'orange' : 'white'}
          strokeWidth={this.__isInspected ? 5 : 2}
          style={{
            cursor: 'pointer',
          }}
          onClick={event => {
            this.props.editor.connectClick(event, this);
            //this.props.editor.inspect(this);
          }}
        />
        {this.props.scale >= 1.5 &&
          <text
            x="0"
            y={10 * this.props.scale}
          >
            {this.props.id}
          </text>
        }

        {this.props.scale >= 3 &&
          <text
            x="0"
            y={15 * this.props.scale}
          >
            {valueType}
          </text>
        }
      </g>
    );
  }
}

module.exports = GraphEditorInputOutput;
