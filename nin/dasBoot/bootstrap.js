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

  initBeatBean();

  demo.looper = createLoop({
    render: demo.render,
    update: demo.update,
    renderer: demo.renderer,
    music: demo.music
  });

  demo.getCurrentFrame = function() {
    return currentFrame;
  };

  demo.jumpToFrame = function(frame) {
    var time = (frame / 60) * 1000;
    if (time > demo.music.getDuration() * 1000) {
      time = demo.music.getDuration() * 1000;
      frame = (time / 1000) * 60;
    }
    else if (frame < 0) {
      frame = 0;
      time = 0;
    }
    demo.music.setCurrentTime(time / 1000);
    demo.looper.time = time;
    demo.looper.oldTime = time;
    demo.looper.deltaTime = 0;
    demo.looper.currentFrame = frame;
    updateBeatBean(frame);
    demo.nm.jumpToFrame(frame);
    demo.update(frame);
    demo.render(demo.renderer, 0);
  };

  function progress(percent) {
    console.log(percent, 'percent complete!');
  }

  function finished() {
    console.log('finished loading :)');
  }

  Loader.start(options.onprogress || progress, options.oncomplete || finished);

  demo.start = function() {
    container.insertBefore(demo.renderer.domElement, container.firstChild);
    demo.resize();
    demo.warmup();
    demo.jumpToFrame(0);
    demo.music.play();
    demo.looper.loop();
  };

  demo.warmup = function() {
    demo.nm.warmup();
  }

  return demo;
};
