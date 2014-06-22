window['bootstrap'] = function(options) {
  options = options || {};

  var demo = {};

  var container = document.body;

  demo.renderer = new THREE.WebGLRenderer({maxLights: 10, antialias: true});
  demo.renderer.setClearColor(0x000000, 1);
  demo.renderer.sortObjects = true;
  demo.renderer.autoClear = false;

  demo.effectComposer = new THREE.EffectComposer(demo.renderer);
  demo.rebuildEffectComposer = function(passes) {
    var clearPass = new ClearPass();
    var toScreenPass = new THREE.ShaderPass(THREE.CopyShader);
    toScreenPass.renderToScreen = true;
    demo.effectComposer = new THREE.EffectComposer(demo.renderer);
    demo.effectComposer.addPass(clearPass);
    for(var i = 0; i < passes.length; i++) {
      demo.effectComposer.addPass(passes[i]);
    }
    demo.effectComposer.addPass(toScreenPass);
  }

  Loader.setRootPath(options.rootPath || '');

  demo.lm = new LayerManager(demo);
  if(options.layers) {
    for(var i = 0; i < options.layers.length; i++) {
      demo.lm.loadLayer(options.layers[i]);
    }
    demo.lm.jumpToFrame(0);
  }

  demo.setContainer = function(c) {
    container = c;
  }

  var currentFrame = 0;

  demo.update = function(frame) {
    currentFrame = frame;
    demo.lm.update(frame);
  }

  demo.render = function(renderer, interpolation) {
    renderer.clear(true, true, true);
    demo.effectComposer.render();
  }

  demo.resize = function() {
    var rect = container.getBoundingClientRect();
    if(rect.width / rect.height > 16 / 9){
      GU = (rect.height / 9);
    }else{
      GU = (rect.width / 16);
    }
    demo.renderer.setSize(16 * GU, 9 * GU);
    demo.renderer.domElement.style.zIndex = 10;
    demo.renderer.domElement.style.position = 'absolute';
    demo.renderer.domElement.style.margin = ((rect.height - 9 * GU) / 2) +
      "px 0 0 " + ((rect.width - 16 * GU) / 2) + "px";
  };

  window.addEventListener('resize', demo.resize);

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

  Loader.start(function progress(percent){
    console.log(percent, 'percent complete!');
  }, function finished(){
    console.log('finished loading :)');  
  });

  demo.start = function() {
    container.appendChild(demo.renderer.domElement);
    demo.resize();
    demo.music.play();
    demo.looper.loop();
  }

  return demo;
}
