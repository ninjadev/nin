const React = require('react');
const commands = require('../commands');
const Waveform = require('./waveform');

class BottomPanel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      xScale: 1,
    };

    this.loopStart = null;
    this.loopEnd = null;
    this.loopActive = false;
    commands.on('getCuePoint', callback => {
      callback(this.loopActive ? this.loopStart : null);
    });
    commands.on('setCuePoint', () => {
      var currentBEAN = BEAN_FOR_FRAME(props.demo.getCurrentFrame());
      var currentQuantizedFrame = FRAME_FOR_BEAN(currentBEAN - currentBEAN % PROJECT.music.subdivision);
      if (this.loopStart === null) {
        this.loopStart = currentQuantizedFrame;
      } else if (this.loopEnd === null) {
        if (this.loopStart > props.demo.getCurrentFrame()) {
          this.loopEnd = currentQuantizedFrame;
          this.loopStart = currentQuantizedFrame;
        } else {
          this.loopEnd = currentQuantizedFrame;
        }
        this.loopActive = true;
      } else {
        this.loopStart = null;
        this.loopEnd = null;
        this.loopActive = false;
      }
    });

    commands.on('multiplyLoopLengthBy', amount => {
      if (this.loopEnd === undefined || this.loopStart === undefined) {
        return;
      }

      var clampedAmount = Math.max(0, amount),
        loopLength = this.loopEnd - this.loopStart,
        newLoopLength = Math.max(1, loopLength * clampedAmount);

      this.loopEnd = this.loopStart + newLoopLength;
    });

    const updateLoop = () => {
      if (this.loopActive && props.demo.getCurrentFrame() >= this.loopEnd) {
        demo.jumpToFrame(this.loopStart);
      }
      var rect = document.body.getBoundingClientRect();
      this.setState({
        xScale: rect.width / (this.props.demo.music.getDuration() * 60),
        currentFrame: props.demo.getCurrentFrame(),
      });
      requestAnimationFrame(updateLoop);
    };
    requestAnimationFrame(updateLoop);

    this.musicLayerClick = this.musicLayerClick.bind(this);
    this.musicLayerScroll = this.musicLayerScroll.bind(this);
  }

  getBarNumberDisplay() {
    const quaver = (BEAN / PROJECT.music.subdivision | 0) % 4;
    const bar = (BEAN / PROJECT.music.subdivision / 4) | 0;
    return `${bar}:${quaver}`;
  }

  getClickOffset(e) {
    var target = document.querySelector('.layers-bar-container');
    var rect = target.getBoundingClientRect();
    var offsetX = (e.clientX - rect.left) | 0;
    var offsetY = (e.clientY - rect.top) | 0;
    return {x: offsetX, y: offsetY};
  }

  musicLayerClick(e) {
    demo.jumpToFrame(this.getClickOffset(e).x / this.state.xScale | 0);
  }

  musicLayerScroll(a) {
    a.preventDefault();
    let multiplier = 50;

    if (a.nativeEvent.shiftKey) {
      multiplier *= 25;
    }

    if (a.nativeEvent.ctrlKey) {
      multiplier /= 10;
    }

    if (a.nativeEvent.wheelDelta < 0) {
      demo.jumpToFrame(Math.round(this.state.currentFrame -= multiplier / this.props.demo.music.getDuration() * 60 * this.state.xScale));
    } else {
      demo.jumpToFrame(Math.round(this.state.currentFrame += multiplier / this.props.demo.music.getDuration() * 60 * this.state.xScale));
    }
  }

  render() {
    return (
      <div className='bottom'>
        <div className="fixed-panel">
          <div className="frame-panel">
            <label>frame</label>
            <span
              className='value'
              title="Global frame for demo"
              >
              { this.state.currentFrame }
            </span>
          </div>

          <div className="beat-bean-panel">
            <label>BEAT</label>
            <span
              className='value'
              title="Global music BEAT boolean for frame"
              >
              { '' + window.BEAT }
            </span>
          </div>

          <div className="beat-bean-panel">
            <label>BEAN</label>
            <span
              className='value'
              title="Global music BEAT number for frame"
              >
              { window.BEAN }
            </span>
          </div>

          <div className="beat-bean-panel">
            <label>Bar</label>
            <span
              className='value'
              title="Global music bar:quaver number for frame"
              >
              { this.getBarNumberDisplay() }
            </span>
          </div>
        </div>

        <div
          className='layers-bar-container'
          onClick={this.musicLayerClick}
          onWheel={this.musicLayerScroll}
          >
          <div
            className="marker-line play"
            style={{
              marginLeft: `${this.state.currentFrame * this.state.xScale}px`,
              height: '50px',
            }}
            >
            <div className={`glow glow-play ${!this.props.demo.music.paused ? 'glow-visible' : ''}`}>
            </div>
          </div>

          { this.loopStart
            ? <div
                className="marker-line loop"
                style={{
                  marginLeft: `${this.loopStart * this.state.xScale}px`,
                  height: '50px',
                }}
                >
                <div className="glow glow-loop"></div>
              </div>
            : null
          }

          { this.loopEnd
            ? <div
                className="marker-line loop"
                style={{
                  marginLeft: `${this.loopEnd * this.state.xScale}px`,
                  height: '50px',
                }}
                >
                <div className="glow glow-loop"></div>
              </div>
            : null
          }

          <div
            className="layer musiclayer"
            onClick={this.musicLayerClick}
            onWheel={this.musicLayerScroll}
            style={{width: `${this.props.demo.music.getDuration() * 60 * this.state.xScale}px`}}
            >
            <Waveform
              selectedTheme={this.props.selectedTheme}
              demo={this.props.demo}
              xScale={this.state.xScale}
              >
              &nbsp;
            </Waveform>
          </div>

        </div>

      </div>
    );
  }
}

module.exports = BottomPanel;
