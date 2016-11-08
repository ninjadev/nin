(function() {
  'use strict';

  angular.module('nin').factory('demo', function(commands, $rootScope){
    const app = MCorp.app('5904326537830503301');
    let wrapper = {
      clock: {
        pos: 0,
        update: () => {}
      }
    };
    app.run = () => {
      wrapper.clock = app.motions['nin'];
    };
    app.init();

    var demo = bootstrap({
      rootPath: '//localhost:9000/',
      wrapper
    });

    window.demo = demo;

    /*$rootScope.globalJSErrors = $rootScope.globalJSErrors || {};
    var originalLoop = demo.looper.loop;
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

    commands.on('playPause', function() {
      if (wrapper.clock.vel != 0.0) {
        wrapper.clock.update(null, 0.0, 0.0);
      } else {
        wrapper.clock.update(null, 1.0, 0.0);
      }
    });

    commands.on('pause', function() {
      wrapper.clock.update(null, 0.0, 0.0);
    });

    commands.on('jog', function(amount) {
      wrapper.clock.update(wrapper.clock.pos + amount / 60);
    });

    commands.on('jumpToFrame', function(frame) {
      wrapper.clock.update(frame / 60);
    });

    commands.on('setPlaybackRate', function(rate) {
      //demo.music.setPlaybackRate(rate);
    });

    var showCameraPathVisualizations = false;
    commands.on('toggleCameraPathVisualizations', function() {
      var showCameraPathVisualizations = !showCameraPathVisualizations;
      demo.lm.showCameraPathVisualizations(showCameraPathVisualizations);
    });

    return demo;
  });
})();
