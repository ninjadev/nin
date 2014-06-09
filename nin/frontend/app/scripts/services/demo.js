'use strict';

angular.module('nin').factory('demo', function(commands){
  var demo = bootstrap({
    rootPath: '//localhost:9999/',
  });

  commands.on('playPause', function() {
    demo.music.paused ? demo.music.play() : demo.music.pause();
  });

  commands.on('jog', function(amount) {
    demo.jumpToFrame(demo.getCurrentFrame() + amount);
  });

  commands.on('jumpToFrame', function(frame) {
    demo.jumpToFrame(frame);
  });

  return demo;
});
