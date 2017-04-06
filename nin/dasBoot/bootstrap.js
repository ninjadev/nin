window['bootstrap'] = function(options) {
  options = options || {};

  var demo = {};
  window.demo = demo;

  var container = document.body;

  demo.renderer = new THREE.WebGLRenderer({maxLights: 10, antialias: true});
  demo.renderer.setClearColor(0x000000, 1);
  demo.renderer.sortObjects = true;
  demo.renderer.autoClear = false;

  Loader.setRootPath(options.rootPath || '');

  demo.nm = new NodeManager(demo);

  demo.setContainer = function(c) {
    container = c;
  };

  const localTimingSrc = new TIMINGSRC.TimingObject();
  const timingSrc = new TIMINGSRC.SkewConverter(localTimingSrc, 0);
  const frameTimingSrc = new TIMINGSRC.ScaleConverter(
      timingSrc, options.frameRateInHz || 60);

  if (options.remoteTimingSrc) {
    const app = MCorp.app(options.remoteTimingSrc, {
      anon: true
    });

    app.run = () => {
      const remoteTimingSrc = new TIMINGSRC.TimingObject({
        provider: app.motions['nin']
      });
      timingSrc.timingsrc = remoteTimingSrc;
    };

    app.init();
  }

  demo.pause = () => {
    timingSrc.update({ velocity: 0 });
  };

  demo.play = () => {
    timingSrc.update({ velocity: 1 });
  };

  demo.playPause = () => {
    if (timingSrc.vel != 0.0) {
      demo.pause();
    } else {
      demo.play();
    }
  };

  demo.jog = (frames) => {
    frameTimingSrc.update({
      position: frameTimingSrc.pos + frames
    });
  };

  demo.jumpToFrame = (position) => {
    frameTimingSrc.update({ position });
  };

  demo.setPlaybackRate = (velocity) => {
    timingSrc.update({ velocity });
  };

  var currentFrame = 0;
  demo.update = function(frame) {
    currentFrame = frame;
    demo.nm.update(frame);
  };

  demo.render = function(renderer) {
    renderer.clear(true, true, true);
    demo.nm.render(renderer);
  };

  demo.resize = function(width, height) {
    var rect = container.getBoundingClientRect();
    width = width || rect.width;
    height = height || rect.height;
    if (width / height > 16 / 9) {
      GU = (height / 9);
    } else {
      GU = (width / 16);
    }
    demo.renderer.setSize(16 * GU, 9 * GU);
    demo.renderer.domElement.style.zIndex = 10;
    demo.renderer.domElement.style.position = 'absolute';
    demo.renderer.domElement.style.margin = ((rect.height - 9 * GU) / 2) +
      'px 0 0 ' + ((rect.width - 16 * GU) / 2) + 'px';
    demo.nm.resize();
    demo.update(currentFrame);
    demo.render(demo.renderer, 0);
  };

  window.addEventListener('resize', function() {
    demo.resize();
  });
  demo.resize();

  demo.music = loadMusic();
  timingSrc.on('change', () => {
    demo.music.setCurrentTime(timingSrc.pos);

    if (demo.music.paused) {
      if (timingSrc.vel >= 0) {
        demo.music.play();
      }
    } else {
      if (timingSrc.vel == 0) {
        demo.music.pause();
      }
    }
  })

  initBeatBean();

  demo.looper = createLoop({
    render: demo.render,
    update: demo.update,
    renderer: demo.renderer,
    music: demo.music,
    timingSrc
  });

  demo.getCurrentFrame = function() {
    return currentFrame;
  };

  function progress(percent) {
    console.log(percent, 'percent complete!');
  }

  function finished() {
    console.log('finished loading :)');
  }

  demo.start = function() {
    container.insertBefore(demo.renderer.domElement, container.firstChild);
    demo.resize();
    demo.warmup();
    demo.looper.loop();
  };

  demo.warmup = function() {
    demo.nm.warmup();
  }

  Loader.start(options.onprogress || progress, options.oncomplete || finished);

  return demo;
};
