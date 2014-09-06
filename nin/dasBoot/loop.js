function createLoop(options) {
  var frameLength = 1000 / (options.frameRateInHz || 60);
  var render = options.render;
  var update = options.update;
  var renderer = options.renderer;
  var music = options.music;


  function Looper() {
    this.time = 0;
    this.oldTime = 0;
    this.deltaTime = 0;
    this.currentFrame = 0;

    var BPM = 105;
    window.BEAT = false;
    window.BEAN = 0;
    var FPB = 1 / (BPM / 60 / (options.frameRateInHz || 60));
    var subdivisor = 6;

    var that = this;
    this.loop = function() {
      that.time = music.currentTime * 1000;
      that.deltaTime += that.time - that.oldTime;
      that.oldTime = that.time;
      while(that.deltaTime >= frameLength) {
        var beatOffset = 8.5;
        if(((that.currentFrame + beatOffset) / (FPB / subdivisor) | 0) > BEAN) {
          BEAT = true;
        } else {
          BEAT = false;
        }
        BEAN = ((that.currentFrame + beatOffset) / (FPB / subdivisor)) | 0;
        update(that.currentFrame++);
        that.deltaTime -= frameLength;
      }
      render(renderer, that.deltaTime / frameLength);
      requestAnimFrame(that.loop);
    };
  };

  return new Looper();
}
