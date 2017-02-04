const React = require('react');
const e = React.createElement;

const meta = {textures: {}, images: {}};

class TextureInputPreview extends React.Component {
  render() {
    const value = this.props.item.getValue();
    return e('text', {y: 40, style: {whiteSpace: 'pre'}}, value && JSON.stringify(value.toJSON(meta), null, 2));
  }
}

const previews = {
  TextureInput: TextureInputPreview
};

class GraphEditorInputOutput extends React.Component {
  render() {
    const preview = previews[this.props.item.constructor.name];
    return e('g', {
      transform: `translate(${this.props.x}, ${this.props.y}) scale(${1 / this.props.scale})`
    },
      e('circle', {cx: 0, cy: 0, r: 5, fill: 'white'}),
      this.props.scale > 1.5 ? e('text', {
        x: 0,
        y: 20,
      }, this.props.id) : null,
      preview && this.props.scale > 10 && e(preview, {item: this.props.item}),
    );
  }
}

module.exports = GraphEditorInputOutput;
