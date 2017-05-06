const React = require('react');

class Volumebar extends React.Component {

  constructor(props) {
    super(props);

    this.volume = 100;
    this.updateVolume = this.updateVolume.bind(this);
  }

  componentDidMount() {
    this.volume = this.props.demo.music.getVolume() * 100;
  }

  updateVolume(e) {
    this.volume = e.nativeEvent.target.value;
    this.props.demo.music.setVolume(-this.volume/100);
  }

  render() {
    return (
      <div className="volume-control">
        <input type="range" className="vertical" min="0" max="100" step="5" style={{marginBottom: '20px', bottom: 0, position: 'absolute'}} onChange={this.updateVolume} value={this.volume}/>
      </div>
    );
  }
}

module.exports = Volumebar;