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

    BEAN = 0;
    BEAT = false;
    var subdivision = 6;
    var beatsPerMinute = 110 * subdivision;
    var beatsPerSecond = beatsPerMinute / 60;
    var framesPerSecond = 60;
    var framesPerBeat = framesPerSecond / beatsPerSecond;
    var frameSyncOffset = 0;

    var that = this;
    this.loop = function() {
      that.time = music.currentTime * 1000;
      that.deltaTime += that.time - that.oldTime;
      that.oldTime = that.time;
      while(that.deltaTime >= frameLength) {
        BEAT = false;
        if((((that.currentFrame + frameSyncOffset - 1) / framesPerBeat) | 0) >
            ((that.currentFrame + frameSyncOffset - 2) / framesPerBeat) | 0) {
          BEAT = true;
        }
        BEAN = that.currentFrame / framesPerBeat | 0;
        update(that.currentFrame++);
        that.deltaTime -= frameLength;
      }
      render(renderer, that.deltaTime / frameLength);
      requestAnimFrame(that.loop);
    };
  };

  return new Looper();
}
