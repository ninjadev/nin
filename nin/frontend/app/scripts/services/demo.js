'use strict';

angular.module('nin').factory('demo', function(commands){
  var demo = bootstrap({
    rootPath: '//localhost:9000/',
  });

  window.demo = demo;

  commands.on('playPause', function() {
    demo.music.paused ? demo.music.play() : demo.music.pause();
  });

  commands.on('jog', function(amount) {
    demo.jumpToFrame(demo.getCurrentFrame() + amount);
  });

  commands.on('jumpToFrame', function(frame) {
    demo.jumpToFrame(frame);
  });

  commands.on('setPlaybackRate', function(rate) {
    demo.music.playbackRate = rate;
  });

  return demo;
});
