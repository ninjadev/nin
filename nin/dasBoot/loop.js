function createLoop(demo) {
  var frameLength = 1000 / 60;

  function Looper() {
    this.time = 0;
    this.oldTime = 0;
    this.deltaTime = 0;
    this.currentFrame = 0;
    this.skippedRenderedFrames = 0;
    this.frameLength = frameLength;

    var that = this;
    this.loop = function () {
      that.time = demo.music.getCurrentTime() * 1000;
      that.deltaTime += that.time - that.oldTime;
      that.oldTime = that.time;
      that.skippedRenderedFrames = -1;
      while (that.deltaTime >= frameLength) {
        that.deltaTime -= frameLength;
        demo.music._calculateFFT();
        updateBeatBean(that.currentFrame);
        demo.update(that.currentFrame++);
        that.skippedRenderedFrames++;
      }
      demo.render(demo.renderer, that.deltaTime / frameLength);
      requestAnimFrame(that.loop);
    };
  }

  return new Looper();
}

module.exports = createLoop;
