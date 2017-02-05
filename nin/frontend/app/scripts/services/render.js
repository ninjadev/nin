class Render {
  constructor(demo, $http, $timeout, commands) {
    this.currentFrame;
    this.currentlyRendering = false;
    this.currentTimeout;
    this.$http = $http;
    this.$timeout = $timeout;

    const that = this;
    commands.on('startRendering', () => {
      demo.resize(1920, 1080);
      that.currentlyRendering = true;
      that.render(demo.getCurrentFrame());
    });

    commands.on('stopRendering', () => {
      demo.resize();
      that.currentlyRendering = false;
      $timeout.cancel(that.currentTimeout);
    });
  }

  render(i) {
    i = i || 0;
    this.currentFrame = i;
    demo.jumpToFrame(i);
    var image = demo.renderer.domElement.toDataURL('image/png');

    this.$http.post('http://localhost:9000/', {
      type: 'render-frame',
      image: image,
      frame: i
    });

    if(this.currentlyRendering) {
      this.currentTimeout = this.$timeout(() => {
        this.render(this.currentFrame + 1);
      }, 0);
    }
  }

  isCurrentlyRendering() {
    return this.currentlyRendering;
  }
}

module.exports = Render;
