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

    var that = this;
    this.loop = function() {
      that.time = music.currentTime * 1000;
      that.deltaTime += that.time - that.oldTime;
      that.oldTime = that.time;
      while(that.deltaTime >= frameLength) {
        BEAT = false;
        if((((that.currentFrame + 1.5) / framesPerBeat) | 0) >
            ((that.currentFrame + 0.5) / framesPerBeat) | 0) {
          BEAT = true;
        }
        BEAN = (that.currentFrame + 1.5) / framesPerBeat | 0;
        update(that.currentFrame++);
        that.deltaTime -= frameLength;
      }
      render(renderer, that.deltaTime / frameLength);
      requestAnimFrame(that.loop);
    };

    BEAN_FOR_FRAME = function(frame) {
      return (frame + 1.5) / framesPerBeat | 0;
    };

    FRAME_FOR_BEAN = function(bean) {
      return ((bean - 1.5) * framesPerBeat + 0.5) | 0;
    };
  }

  return new Looper();
}
