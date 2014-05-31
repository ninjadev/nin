function bootstrap(options) {
  options = options || {};

  var demo = {};

  var container = document.body;

  demo.renderer = new THREE.WebGLRenderer({maxLights: 10, antialias: true});
  demo.renderer.setClearColor(0x000000, 1);
  demo.renderer.sortObjects = false;
  demo.renderer.autoClear = false;

  Loader.setRootPath(options.rootPath || '');

  demo.lm = new LayerManager();

  demo.setContainer = function(c) {
    container = c;
  }

  demo.update = function(frame) {
    demo.lm.update(frame);
  }

  demo.render = function(renderer, interpolation) {
    renderer.clear();
    demo.lm.render(renderer, interpolation);
  }

  function resize() {
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

  window.addEventListener('resize', resize);

  demo.music = document.createElement('audio');
  Loader.load('res/music.mp3', demo.music); 

  demo.loop = createLoop({
    render: demo.render,
    update: demo.update,
    renderer: demo.renderer,
    music: demo.music
  });  

  Loader.start(function progress(percent){
    console.log(percent, 'percent complete!');
  }, function finished(){
    console.log('finished loading :)');  
  });

  demo.start = function() {
    container.appendChild(demo.renderer.domElement);
    resize();
    demo.music.play();
    demo.loop();
  }

  return demo;
}
