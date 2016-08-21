class Render {
  constructor(demo, $http, commands) {
    this.currentFrame;
    this.currentlyRendering = false;
    this.currentTimeout;

    commands.on('startRendering', function() {
      demo.resize(1920, 1080);
      this.currentlyRendering = true;
      this.render(demo.getCurrentFrame());
    });

    commands.on('stopRendering', function() {
      demo.resize();
      this.currentlyRendering = false;
      cancelTimeout(this.currentTimeout);
    });
  }

  render(i) {
    i = i || 0;
    this.currentFrame = i;
    demo.jumpToFrame(i);
    var image = demo.renderer.domElement.toDataURL('image/png');

    $http.post('http://localhost:9000/', {
        type: 'render-frame',
        image: image,
        frame: i
      });

    if(this.currentlyRendering) {
      this.currentTimeout = setTimeout(function() {
        this.render(this.currentFrame + 1);
      }, 0);
    }
  }

  isCurrentlyRendering() {
    return this.currentlyRendering;
  }
}

module.exports = Render;
