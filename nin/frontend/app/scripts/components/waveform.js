const React = require('react');
const Waveform = require('../../lib/waveform');

class WaveformWrapper extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      duration: 0,
    };
  }

  componentDidMount() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var context = new AudioContext();

    var innerColor = '';
    if(this.props.selectedTheme == 'dark') {
      innerColor = '#0a1a24';
    } else if(this.props.selectedTheme == 'light') {
      innerColor = '#ababab';
    }

    if(innerColor) {
      var waveform;
      var request = new XMLHttpRequest();
      request.open('GET', '/project/' + PROJECT.music.path, true);
      request.responseType = 'arraybuffer';
      request.onload = () => {
        context.decodeAudioData(request.response, buffer => {
          var channelData = buffer.getChannelData(1);
          var duration = channelData.length / context.sampleRate * 60;
          this.setState({ duration });
          this.forceUpdate();
          waveform = new Waveform({
            container: this.container,
            height: 50,
            width: duration,
            interpolate: true,
            innerColor: innerColor,
            outerColor: 'rgba(0, 0, 0, 0)',
            data: channelData
          });
          waveform.canvas.style.position = 'absolute';
          waveform.canvas.style.top = '0px';
        });
      };
      request.send();
    }
  }

  shouldComponentUpdate() {
    return false;
  }

  render() {
    const white = '#d3dde3';
    const grey = 'rgb(42, 62, 72)';
    const pixelSize = 1 / window.devicePixelRatio;
    const beatOffset = (PROJECT.music.beatOffset || 0);
    const beatLength = this.state.duration * this.props.xScale / (this.state.duration / 60 / 60 * PROJECT.music.bpm);
    const gradientArguments = [];
    gradientArguments.push('90deg');
    const lineColorA = '#0a1a24';
    const lineColorB = '#22323c';
    const backgroundColorA = '#34444e';
    const backgroundColorB = '#2e3e48';

    for(let i = 0; i < 32; i++) {
      const lineColor = (i % 4 == 0) ? lineColorA : lineColorB;
      const backgroundColor = i % 32 >= 16 ? backgroundColorA : backgroundColorB;
      if(i % 4 == 0) {
        gradientArguments.push(lineColor + ` ${beatLength * i}px`);
        gradientArguments.push(lineColor + ` ${beatLength * i + pixelSize}px`);
      }
      gradientArguments.push(`${backgroundColor} ${beatLength * i + pixelSize}px`);
      gradientArguments.push(`${backgroundColor} ${beatLength * (i + 1)}px`);
    }

    return (
      <div
        style={{
          height: '100%',
          backgroundColor: backgroundColorB,
          backgroundImage:
            `repeating-linear-gradient(${gradientArguments.join(',')})`,
          backgroundPosition: `${beatLength * beatOffset}px`,
        }}
        ref={ref => this.container = ref}
        >
      </div>
    );
  }
}

module.exports = WaveformWrapper;
