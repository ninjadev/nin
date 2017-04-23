const React = require('react');
const Waveform = require('../../lib/waveform');

class WaveformWrapper extends React.Component {

  componentDidMount() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var context = new AudioContext();

    var innerColor = '';
    if(this.props.selectedTheme == 'dark') {
      innerColor = 'rgb(46, 62, 72)';
    } else if(this.props.selectedTheme == 'light') {
      innerColor = '#ababab';
    }

    if(innerColor) {
      var waveform;
      var request = new XMLHttpRequest();
      request.open('GET', '//localhost:9000/' + PROJECT.music.path, true);
      request.responseType = 'arraybuffer';
      request.onload = () => {
        context.decodeAudioData(request.response, buffer => {
          var channelData = buffer.getChannelData(1);
          var duration = channelData.length / 44100 * 60;
          waveform = new Waveform({
            container: this.container,
            height: 50,
            width: duration,
            interpolate: true,
            innerColor: innerColor,
            outerColor: 'rgba(0, 0, 0, 0)',
            data: channelData
          });
        });
      };
      request.send();
    }
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    return (
      <div className='over' ref={ref => this.container = ref}></div>
    );
  }
}

module.exports = WaveformWrapper;
