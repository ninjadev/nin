var framesPerBEAT;
window.BEAN = 0;
window.BEAT = false;

const initBeatBean = function() {
  window.BEAN = 0;
  window.BEAT = false;

  var BEATsPerMinute = PROJECT.music.bpm * PROJECT.music.subdivision;
  var BEATsPerSecond = BEATsPerMinute / 60;
  var framesPerSecond = 60;
  framesPerBEAT = framesPerSecond / BEATsPerSecond;

  window.BEAN_FOR_FRAME = function(frame) {
    return (frame + 1.5) / framesPerBEAT | 0;
  };

  window.FRAME_FOR_BEAN = function(bean) {
    return (bean * framesPerBEAT - 0.5) | 0;
  };
};

const updateBeatBean = function(frame) {
  window.BEAT = false;
  if ((((frame + 1.5) / framesPerBEAT) | 0) >
      ((frame + 0.5) / framesPerBEAT) | 0) {
    window.BEAT = true;
  }
  var bean = (frame + 1.5) / framesPerBEAT | 0;
  window.BEAN = bean;

  var f = (frame - FRAME_FOR_BEAN(bean))
        / (FRAME_FOR_BEAN(bean+1) - FRAME_FOR_BEAN(bean));
  window.INTERBEAN = lerp(bean, bean+1, f);
};

module.exports = {initBeatBean, updateBeatBean};
