const React = require('react');
const commands = require('../commands');
const errorExcerpt = require('../utils/errorExcerpt');
const stackFormat = require('../utils/stackFormat');

class DemoPlayer extends React.Component {
  constructor(props) {
    super(props);

    commands.on('resetFlyFlightDynamics', function() {
      camera.resetFlyFlightDynamics();
    });
    commands.on('increaseCameraZoom', function() {
      camera.deltaFov(-0.5);
    });
    commands.on('decreaseCameraZoom', function() {
      camera.deltaFov(0.5);
    });

    setTimeout(() => {
      this.props.demo.resize();
    });

    this.resizeOverlay = () => {
      const rect = this.container.getBoundingClientRect();
      let width = 0;
      let height = 0;
      if(rect.width / rect.height < 16 / 9) {
        width = rect.width;
        height = width / 16 * 9;
      } else {
        height = rect.height;
        width = height / 9  * 16;
      }
      this.overlayElement.style.width = `${width}px`;
      this.overlayElement.style.height = `${height}px`;
      this.overlayElement.style.left = `${(rect.width - width) / 2}px`;
    };
  }

  toggleFlyAroundMode() {
    return this.camera.toggleFlyAroundMode();
  }

  resetFlyFlightDynamics() {
    return this.camera.resetFlyFlightDynamics();
  }

  componentDidMount() {
    this.resizeOverlay();

    window.addEventListener('resize', this.resizeOverlay);

    setTimeout(() => {
      this.props.demo.start();
      this.props.demo.music.pause();
      this.props.demo.jumpToFrame(0);
    }, 0);

    this.props.demo.setContainer(this.container);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.fullscreen) {
      // go to fullscreen
      document.body.classList.add('fullscreen');
    } else {
      // exit fullscreen
      document.body.classList.remove('fullscreen');
    }
    try {
      this.props.demo.resize();
    } catch(e) {
      /* just ignoring any crashes here since they will be caught in the next
       * render loop anyway, and we have a nicer error formatting setup over
       * there. */
    }
    this.resizeOverlay();
  }

  render() {
    return (
      <div className="floating-viewer-container">
        { Object.keys(this.props.globalJSErrors).map(errorKey => {
          const error = this.props.globalJSErrors[errorKey];
          return (
            <div className='global-error-overlay' key={errorKey}>
              <div className='context'>⛄ { error.context } ⛄</div>
              <div className="bg">
                <div className="header"><strong>{ error.stack.split('\n')[0] }</strong></div>
                <div className="excerpt" dangerouslySetInnerHTML={{__html: errorExcerpt(error, this.props.fileCache) }}>
                </div>
                <div className="stack" dangerouslySetInnerHTML={{__html: stackFormat(error) }}>
                </div>
              </div>
            </div>
          );
        })}
        <div className="demo-container" ref={ref => this.container = ref}>
          <img
            src="images/overlay.png"
            className="overlay"
            style={{
              display: this.props.showFramingOverlay ? 'block' : 'none'
            }}
            ref={ref => this.overlayElement = ref}
            />
        </div>
      </div>
    );
  }
}

module.exports = DemoPlayer;
