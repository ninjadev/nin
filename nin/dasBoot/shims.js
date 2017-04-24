var requestAnimFrame = (function() {
  return window.requestAnimationFrame || 
    window.webkitRequestAnimationFrame || 
    window.mozRequestAnimationFrame || 
    window.oRequestAnimationFrame || 
    window.msRequestAnimationFrame || 
    function(callback){
      window.setTimeout(callback, 0)
    };
})();

var makeFullscreen = function(elem) {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) {
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) {
    elem.webkitRequestFullscreen();
  }
};

var audioContext = (function() {
  return window.AudioContext ||
    window.webkitAudioContext;
})();

module.exports = {requestAnimFrame, makeFullscreen, audioContext};
