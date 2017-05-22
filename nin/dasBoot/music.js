const Loader = require('./Loader');
const {audioContext} = require('./shims');

function loadMusic() {
  var webAudioContext = new audioContext();
  var _bufferSource;
  var _buffer;
  var _loaded = false;
  Loader.loadAjax(window.PROJECT.music.path, {responseType: 'arraybuffer'}, function(data, registerAsLoaded) {
    webAudioContext.decodeAudioData(data, function(buffer) {
      _buffer = buffer;
      _loaded = true;
      registerAsLoaded();
    });
  });
  var _gainNode = webAudioContext.createGain();
  _gainNode.gain.value = 1;
  _gainNode.connect(webAudioContext.destination);
  var _analyserNode = webAudioContext.createAnalyser();
  _analyserNode.fftSize = 2048;
  var bufferLength = _analyserNode.frequencyBinCount;
  var fftBuffer = new Float32Array(bufferLength);
  _analyserNode.connect(_gainNode);

  var _currentLocalTime = 0;
  var _globalTimeOffset = 0;
  var _playbackRate = 1;

  return {
    paused: true,

    audioContext: webAudioContext,

    _calculateFFT: function() {
      _analyserNode.getFloatFrequencyData(fftBuffer);
    },

    getFFT: function() {
      return fftBuffer;
    },

    getFftSize: function() {
      return _analyserNode.fftSize;
    },

    setCurrentTime: function(currentTime) {
      _currentLocalTime = currentTime;
      _globalTimeOffset = webAudioContext.currentTime;
      if(!this.paused) {
        this.play();
      }
    },

    setPlaybackRate: function(playbackRate) {
      var shouldPlay = !this.paused;
      this.pause();
      _playbackRate = playbackRate;
      if(shouldPlay) {
        this.play();
      }
    },

    getCurrentTime: function() {
      var currentTime = _currentLocalTime;
      if(!this.paused) {
        currentTime = _currentLocalTime + (webAudioContext.currentTime - _globalTimeOffset) * _playbackRate;
      }
      if(currentTime > this.getDuration()) {
        currentTime = this.getDuration();
      }
      return currentTime;
    },

    setVolume: function(volume) {
      _gainNode.gain.value = volume;
    },

    getVolume: function() {
      return _gainNode.gain.value;
    },

    play: function() {
      if(!_loaded) {
        return;
      }
      _globalTimeOffset = webAudioContext.currentTime;
      if (!this.paused) {
        _bufferSource && _bufferSource.stop(0);
      }
      this.paused = false;
      _bufferSource = webAudioContext.createBufferSource();
      _bufferSource.buffer = _buffer;
      _bufferSource.connect(_analyserNode);
      _bufferSource.start(0, _currentLocalTime);
      _bufferSource.playbackRate.value = _playbackRate;
    },

    getDuration: function() {
      return _buffer && _buffer.duration;
    },

    pause: function() {
      this.setCurrentTime(this.getCurrentTime());
      this.paused = true;
      _bufferSource && _bufferSource.stop(0);
    }
  }
}

module.exports = loadMusic;
