(function() {
  'use strict';

  angular.module('nin').factory('demo', function(commands, $rootScope){
    var demo = bootstrap({
      rootPath: '//localhost:9000/',
    });

    window.demo = demo;

    var originalLoop = demo.looper.loop;
    demo.looper.loop = function() {
      var wasError = false;
      try {
        originalLoop();
      } catch(e) {
        wasError = true;
        $rootScope.globalJSError = e;
        requestAnimFrame(demo.looper.loop);
      }
      if(!wasError) {
        $rootScope.globalJSError = '';
      }
    };

    commands.on('playPause', function() {
      if(demo.music.paused) {
        demo.music.play();
      } else {
        demo.music.pause();
      }
    });

    commands.on('pause', function() {
      demo.music.pause();
    });

    commands.on('jog', function(amount) {
      demo.jumpToFrame(demo.getCurrentFrame() + amount);
    });

    commands.on('jumpToFrame', function(frame) {
      demo.jumpToFrame(frame);
    });

    commands.on('setPlaybackRate', function(rate) {
      demo.music.setPlaybackRate(rate);
    });

    var showCameraPathVisualizations = false;
    commands.on('toggleCameraPathVisualizations', function() {
      var showCameraPathVisualizations = !showCameraPathVisualizations;
      demo.lm.showCameraPathVisualizations(showCameraPathVisualizations);
    });

    return demo;
  });
})();
