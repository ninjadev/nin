const React = require('react');
const e = React.createElement;

let THREEConstantMapping = {};
for(let key in THREE) {
  if(typeof THREE[key] === 'number') {  // eslint-disable-line angular/typecheck-number
    THREEConstantMapping[THREE[key]] = `THREE.${key}`;
  }
}

let vector2toString = vector2 => `(${vector2.x}, ${vector2.y})`;

class TextureInputPreview extends React.Component {
  render() {
    const value = this.props.item.getValue();
    if(!value) {
      return null;
    }
    const items = {
      id: value.id,
      uuid: value.uuid,
      name: value.name,
      mipmaps: value.mipmaps,
      mapping: THREEConstantMapping[value.mapping],
      wrapS: THREEConstantMapping[value.wrapS],
      wrapT: THREEConstantMapping[value.wrapT],
      magFilter: THREEConstantMapping[value.magFilter],
      minFilter: THREEConstantMapping[value.minFilter],
      anisotropy: value.anisotropy,
      format: THREEConstantMapping[value.format],
      type: THREEConstantMapping[value.type],
      offset: vector2toString(value.offset),
      repeat: vector2toString(value.repeat),
      generateMipmaps: value.generateMipmaps,
      premultiplyAlpha: value.premultiplyAlpha,
      flipY: value.flipY,
      unpackAlignment: value.unpackAlignment,
      encoding: THREEConstantMapping[value.encoding],
      version: value.version,
      needsUpdate: value.needsUpdate,
    };
    return e('table', {}, e('tbody', {},
      Object.keys(items).map(key =>
        e('tr', {key: `${key}|${items[key]}`},
          e('td', {}, key),
          e('td', {className: 'monospaced'}, items[key]))),
    ));
  }
}

const previews = {
  TextureInput: TextureInputPreview
};

class GraphEditorInputOutput extends React.Component {

  render() {
    const preview = previews[this.props.item.constructor.name];
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
        r: 5,
        fill: isConnected ? 'white' : 'transparent',
        stroke: 'white',
        strokeWidth: 2,
        onClick: event => {this.props.editor.startOrCompleteConnection(this.props.item);},
      }),
      this.props.scale >= 1.5 ? e('text', {
        x: 0,
        y: 10 * this.props.scale,
      }, this.props.id) : null,
        preview && this.props.scale > 3 && e('g', {
          transform: `scale(${Math.min(1, this.props.scale / 40)}) translate(200, -100)`,
        }, e('foreignObject', {x: -50, y: -25, width: 100, height: 50,},
          e('div', {xmlns: 'http://www.w3.org/1999/xhtml'}, e(preview, {item: this.props.item}))),
    ));
  }
}

module.exports = GraphEditorInputOutput;
