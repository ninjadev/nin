const Stats = require('../../lib/stats.min.js');


function demo(commands, $rootScope, $window) {
  var demo = bootstrap({
    rootPath: '//localhost:9000/',
  });

  $window.demo = demo;

  $rootScope.globalJSErrors = $rootScope.globalJSErrors || {};
  var originalLoop = demo.looper.loop;
  var forcedPause = false;
  const stats = [];
  const statsContainer = document.createElement('div');
  document.body.appendChild(statsContainer);
  statsContainer.style.position = 'fixed';
  statsContainer.style.bottom = '80px';
  statsContainer.style.right = '30px';
  for(let i = 0; i < 3; i++) {
    stats[i] = Stats();
    stats[i].showPanel(2 - i);
    statsContainer.appendChild(stats[i].dom);
    stats[i].dom.style.position = 'static';
    stats[i].dom.style.float = 'right';
    stats[i].dom.style.display = 'block';
  }

  commands.on('toggleStats', () => {
    for(let i = 0; i < 3; i++) {
      stats[i].dom.style.display = stats[i].dom.style.display == 'none' ? 'block' : 'none';
    }
  });


  demo.looper.loop = function() {
    try {
      for(let i = 0; i < 3; i++) {
        stats[i].begin();
      }
      originalLoop();
      for(let i = 0; i < 3; i++) {
        stats[i].end();
      }

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
}

module.exports = demo;
