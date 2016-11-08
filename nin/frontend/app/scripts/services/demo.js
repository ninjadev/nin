function demo(commands, $rootScope, $window) {
  const demo = bootstrap({
    rootPath: '//localhost:9000/'//,
    //remoteTimingSrc: '8533728114083661980'
  });

  $window.demo = demo;

  $rootScope.globalJSErrors = $rootScope.globalJSErrors || {};
  /*var originalLoop = demo.looper.loop;
  var forcedPause = false;
  demo.looper.loop = function() {
    try {
      originalLoop();

      if (forcedPause) {
        demo.music.play();
        forcedPause = false;
      }

      delete $rootScope.globalJSErrors.looper;
    } catch(e) {
      e.context = "Error during looping of demo";
      $rootScope.globalJSErrors.looper = e;

      demo.looper.deltaTime += demo.looper.frameLength;
      demo.looper.currentFrame -= 1;

      if (!demo.music.paused) {
        demo.music.pause();
        forcedPause = true;
      }

      requestAnimFrame(demo.looper.loop);
    }
  };*/

  commands.on('playPause', demo.playPause);
  commands.on('pause', demo.pause);
  commands.on('jog', demo.jog);
  commands.on('jumpToFrame', demo.jumpToFrame);
  commands.on('setPlaybackRate', demo.setPlaybackRate);

  var showCameraPathVisualizations = false;
  commands.on('toggleCameraPathVisualizations', function() {
    var showCameraPathVisualizations = !showCameraPathVisualizations;
    demo.lm.showCameraPathVisualizations(showCameraPathVisualizations);
  });

  return demo;
}

module.exports = demo;
