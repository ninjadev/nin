window['bootstrap'] = function(options) {
  options = options || {};

  var demo = {};

  var container = document.body;

  demo.renderer = new THREE.WebGLRenderer({maxLights: 10, antialias: true});
  demo.renderer.setClearColor(0x000000, 1);
  demo.renderer.sortObjects = true;
  demo.renderer.autoClear = false;
  demo.renderer.shadowMap.enabled = true;
  demo.renderer.shadowCameraNear = 1;
  demo.renderer.shadowCameraFar = 10000;
  demo.renderer.shadowCameraFov = 50;

  demo.renderer.shadowMapBias = 0.0039;
  demo.renderer.shadowMapDarkness = 0.5;
  demo.renderer.shadowMapWidth = 1024;
  demo.renderer.shadowMapHeight = 1024;

  demo.effectComposer = new THREE.EffectComposer(demo.renderer);
  demo.rebuildEffectComposer = function(passes) {
    var clearPass = new THREE.ClearPass();
    var toScreenPass = new THREE.ShaderPass(THREE.CopyShader);
    toScreenPass.renderToScreen = true;
    demo.effectComposer = new THREE.EffectComposer(demo.renderer);
    demo.effectComposer.addPass(clearPass);
    for (var i = 0; i < passes.length; i++) {
      passes[i] && demo.effectComposer.addPass(passes[i]);
    }
    demo.effectComposer.addPass(toScreenPass);
  };

  Loader.setRootPath(options.rootPath || '');

  demo.lm = new LayerManager(demo);
  if (options.layers) {
    for (var i = 0; i < options.layers.length; i++) {
      var layer = options.layers[i];
      layer.position = i;
      demo.lm.loadLayer(layer);
    }
    demo.lm.jumpToFrame(0);
  }

  if (options.camerapaths) {
    CameraController.paths = options.camerapaths;
    for (var index in CameraController.layers) {
      CameraController.layers[index].parseCameraPath(options.camerapaths);
    }
    demo.lm.jumpToFrame(0);
  }

  demo.setContainer = function(c) {
    container = c;
  };

  var currentFrame = 0;

  demo.update = function(frame) {
    currentFrame = frame;
    demo.lm.update(frame);
  };

  demo.render = function(renderer, interpolation) {
    renderer.clear(true, true, true);
    demo.lm.render(renderer, interpolation);
    demo.effectComposer.render();
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
    demo.effectComposer.setSize(16 * GU, 9 * GU);
    demo.lm.resize();
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
    demo.lm.jumpToFrame(frame);
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
    demo.music.play();
    demo.looper.loop();
  };

  return demo;
};
