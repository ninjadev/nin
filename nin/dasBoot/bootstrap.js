window['bootstrap'] = function(options) {
  options = options || {};

  var demo = {};

  var container = document.body;

  demo.renderer = new THREE.WebGLRenderer({
    maxLights: 10,
    antialias: true
  });
  demo.renderer.setClearColor(0x000000, 1);
  demo.renderer.sortObjects = true;
  demo.renderer.autoClear = false;
  demo.renderer.shadowMapEnabled = true;
  demo.renderer.shadowMapSoft = true;
  demo.renderer.shadowCameraNear = 0.1;
  demo.renderer.shadowCameraFar = 10000;
  demo.renderer.shadowCameraFov = 50;

  demo.renderer.shadowMapBias = 0.0039;
  demo.renderer.shadowMapDarkness = 0.5;
  demo.renderer.shadowMapWidth = 1024;
  demo.renderer.shadowMapHeight = 1024;

  demo.effectComposer = new THREE.EffectComposer(demo.renderer);
  demo.rebuildEffectComposer = function(passes) {
    var clearPass = new ClearPass();
    var toScreenPass = new THREE.ShaderPass(THREE.CopyShader);
    toScreenPass.renderToScreen = true;
    demo.effectComposer = new THREE.EffectComposer(demo.renderer);
    demo.effectComposer.addPass(clearPass);
    for(var i = 0; i < passes.length; i++) {
      passes[i] && demo.effectComposer.addPass(passes[i]);
    }
    demo.effectComposer.addPass(toScreenPass);
  }

  Loader.setRootPath(options.rootPath || '');

  demo.lm = new LayerManager(demo);
  if(options.layers) {
    for(var i = 0; i < options.layers.length; i++) {
      var layer = options.layers[i];
      layer.position = i;
      demo.lm.loadLayer(layer);
    }
    demo.lm.jumpToFrame(0);
  }
  if(options.camerapaths) {
    CameraController.paths = options.camerapaths;
    for (var index in CameraController.layers) {
      CameraController.layers[index].parseCameraPath(options.camerapaths);
    };
    demo.lm.jumpToFrame(0);
  }

  demo.setContainer = function(c) {
    container = c;
  }

  var currentFrame = 0;

  var BPM = 105;
  window.BEAT = false;
  window.BEAN = 0;
  var FPB = 1 / (BPM / 60 / (options.frameRateInHz || 60));
  var subdivisor = 6;

  demo.update = function(frame) {
    currentFrame = frame;
    var beatOffset = 8.5;
    if(((currentFrame + beatOffset) / (FPB / subdivisor) | 0) > BEAN) {
      BEAT = true;
    } else {
      BEAT = false;
    }
    BEAN = ((currentFrame + beatOffset) / (FPB / subdivisor)) | 0;
    demo.lm.update(frame);
  }

  demo.render = function(renderer, interpolation) {
    renderer.clear(true, true, true);
    demo.effectComposer.render();
  }

  demo.resize = function(width, height) {
    if(!width || !height) {
      var rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
    }
    if(width / height > 16 / 9){
      GU = (height / 9);
    }else{
      GU = (width / 16);
    }
    demo.renderer.setSize(16 * GU, 9 * GU);
    demo.renderer.domElement.style.zIndex = 10;
    demo.renderer.domElement.style.position = 'absolute';
    demo.renderer.domElement.style.margin = ((height - 9 * GU) / 2) +
      "px 0 0 " + ((width - 16 * GU) / 2) + "px";
    demo.effectComposer.setSize(16 * GU, 9 * GU);
    demo.lm.resize();
    demo.update(currentFrame);
    demo.render(demo.renderer, 0);
  };

  window.addEventListener('resize', demo.resize);
  demo.resize();

  demo.music = document.createElement('audio');
  Loader.load('res/music.mp3', demo.music); 

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
    var time = (frame / 60 )* 1000;
    if (time > demo.music.duration * 1000){
      time = demo.music.duration * 1000;
      frame = (time / 1000) * 60;
    }
    else if (frame < 0) {
      frame = 0;
      time = 0;
    }
    demo.music.currentTime = time / 1000;
    demo.looper.time = time;
    demo.looper.oldTime = time;
    demo.looper.deltaTime = 0;
    demo.looper.currentFrame = frame;
    demo.lm.jumpToFrame(frame);
    demo.update(frame);
    demo.render(demo.renderer, 0);
  };

  Loader.start(options.onprogress || function progress(percent){
    console.log(percent, 'percent complete!');
  }, options.oncomplete || function finished(){
    console.log('finished loading :)');  
  });

  demo.start = function() {
    container.insertBefore(demo.renderer.domElement, container.firstChild);
    demo.resize();
    demo.music.play();
    demo.looper.loop();
  }

  return demo;
}
