(function() {
  var framesPerBEAT;

  initBeatBean = function() {
    BEAN = 0;
    BEAT = false;

    var BEATsPerMinute = PROJECT.music.bpm * PROJECT.music.subdivision;
    var BEATsPerSecond = BEATsPerMinute / 60;
    var framesPerSecond = 60;
    framesPerBEAT = framesPerSecond / BEATsPerSecond;

    BEAN_FOR_FRAME = function(frame) {
      return (frame + 1.5) / framesPerBEAT | 0;
    };

    FRAME_FOR_BEAN = function(bean) {
      return (bean * framesPerBEAT - 0.5) | 0;
    };
  };

  updateBeatBean = function(frame) {
    BEAT = false;
    if ((((frame + 1.5) / framesPerBEAT) | 0) >
        ((frame + 0.5) / framesPerBEAT) | 0) {
      BEAT = true;
    }
    BEAN = (frame + 1.5) / framesPerBEAT | 0;
  };
})();
