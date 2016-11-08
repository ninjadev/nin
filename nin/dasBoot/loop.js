function createLoop(options) {
  var frameLength = 1000 / (options.frameRateInHz || 60);
  var render = options.render;
  var update = options.update;
  var renderer = options.renderer;
  var music = options.music;
  var wrapper = options.wrapper;

  function Looper() {
    this.time = 0;
    this.oldTime = 0;
    this.deltaTime = 0;
    this.currentFrame = 0;
    this.frameLength = frameLength;

    var that = this;
    this.loop = function() {
      that.time = wrapper.clock.pos * 1000;

      if (that.time < that.oldTime) {
        that.currentFrame = (that.time / 1000) * 60;
        that.deltaTime = 0;
      } else {
        that.deltaTime += that.time - that.oldTime;
      }

      that.oldTime = that.time;

      while (that.deltaTime >= frameLength) {
        that.deltaTime -= frameLength;
        //demo.music._calculateFFT();
        updateBeatBean(that.currentFrame);
        update(that.currentFrame++);
      }

      render(renderer, that.deltaTime / frameLength);
      requestAnimFrame(that.loop);
    };
  }

  return new Looper();
}
