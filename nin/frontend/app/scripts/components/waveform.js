const React = require('react');

class WaveformWrapper extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      duration: 0,
      channelData: [],
    };
  }

  componentDidMount() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var context = new AudioContext();

    var request = new XMLHttpRequest();
    request.open('GET', '/project/' + PROJECT.music.path, true);
    request.responseType = 'arraybuffer';
    request.onload = () => {
      context.decodeAudioData(request.response, buffer => {
        var channelData = buffer.getChannelData(0);
        var duration = channelData.length / context.sampleRate * 60;
        this.setState({
          duration,
          channelData,
        });
        this.forceUpdate();
      });
    };
    request.send();

    window.addEventListener('resize', () => this.forceUpdate());
  }

  shouldComponentUpdate() {
    return false;
  }

  drawOnCanvas() {
    const ctx = this.waveform.getContext('2d');
    ctx.fillStyle = 'white';

    const white = '#d3dde3';
    const grey = 'rgb(42, 62, 72)';
    const pixelSize = 1 / window.devicePixelRatio;
    const beatOffset = (PROJECT.music.beatOffset || 0);
    const beatLength = this.state.duration * this.props.xScale / (this.state.duration / 60 / 60 * PROJECT.music.bpm);
    const gradientArguments = [];
    gradientArguments.push('90deg');
    let lineColorA = '#0a1a24';
    let lineColorB = '#22323c';
    let backgroundColorA = '#34444e';
    let backgroundColorB = '#2e3e48';

    let peak = 0;
    for(let i = 0; i < this.state.channelData.length; i++) {
      const amplitude = Math.abs(this.state.channelData[i]);
      if(amplitude > peak) {
        peak = amplitude;
      }
    }

    let indexToFrame = i => i / this.waveform.width * this.state.duration | 0;
    let indexToSample = i => i / this.waveform.width * this.state.channelData.length | 0;
    let currentFrame = -1;
    let previousFrame = -1;
    let currentBEAN = -1;
    let previousBEAN = -1;
    let currentBar = -1;
    let previousBar = -1;
    let channelDataIndex = 0;
    let color;
    for(let i = 0; i < this.waveform.width; i++) {
      previousFrame = currentFrame;
      currentFrame = indexToFrame(i);
      previousBEAN = currentBEAN;
      currentBEAN = BEAN_FOR_FRAME(currentFrame);
      previousBar = currentBar;
      currentBar = currentBEAN / PROJECT.music.subdivision | 0;
      const barOffset = PROJECT.music.BEANOffset / PROJECT.music.subdivision;
      if(currentBar >= barOffset) {
        if((currentBar - barOffset) % 16 < (previousBar - barOffset) % 16) {
          const temp = backgroundColorA;
          backgroundColorA = backgroundColorB;
          backgroundColorB = temp;
        }
        color = backgroundColorA;
        if(currentBar > previousBar) {
          color = (currentBar - barOffset) % 4 == 0 ? lineColorA : lineColorB;
        }
      } else {
        color = backgroundColorA;
      }
      ctx.fillStyle = color;
      ctx.fillRect(i, 0, 1, this.waveform.height);

      let targetChannelDataIndex = indexToSample(i);
      let channelDataMaxPooler = 0;
      while(channelDataIndex++ < targetChannelDataIndex) {
        channelDataMaxPooler = Math.max(
            channelDataMaxPooler,
            Math.abs(this.state.channelData[channelDataIndex]));
      }
      let amplitude = channelDataMaxPooler / peak * 25;
      ctx.fillStyle = 'rgba(10, 26, 36, 0.5)';
      ctx.fillRect(i, 25 - amplitude, 1, amplitude * 2);
    }
    ctx.fillStyle = 'rgba(10, 26, 36, 0.3)';
    ctx.fillRect(0, 24.5, this.waveform.width, 1);
  }

  render() {

    const canvasWidth = (window.innerWidth - 50) * window.devicePixelRatio;
    const canvasHeight = 50;

    /* defer this so that we can get a reference to the canvas */
    setTimeout(() => this.drawOnCanvas());

    return (
      <div style={{height: '100%'}} >
        <canvas
          ref={ref => this.waveform = ref}
          width={canvasWidth}
          height={canvasHeight}
          style={{
            position: 'absolute',
            top: '0px',
          }}
          >
        </canvas>
      </div>
    );
  }
}

module.exports = WaveformWrapper;
