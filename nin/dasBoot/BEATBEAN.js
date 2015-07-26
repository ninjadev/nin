(function() {
  var framesPerBeat;

  initBeatBean = function() {
    BEAN = 0;
    BEAT = false;

    var subdivision = 6;
    var beatsPerMinute = 110 * subdivision;
    var beatsPerSecond = beatsPerMinute / 60;
    var framesPerSecond = 60;
    framesPerBeat = framesPerSecond / beatsPerSecond;

    BEAN_FOR_FRAME = function(frame) {
      return (frame + 1.5) / framesPerBeat | 0;
    };

    FRAME_FOR_BEAN = function(bean) {
      return ((bean - 1.5) * framesPerBeat + 0.5) | 0;
    };
  };

  updateBeatBean = function(frame) {
    BEAT = false;
    if ((((frame + 1.5) / framesPerBeat) | 0) >
        ((frame + 0.5) / framesPerBeat) | 0) {
      BEAT = true;
    }
    BEAN = (frame + 1.5) / framesPerBeat | 0;
  };
})();
