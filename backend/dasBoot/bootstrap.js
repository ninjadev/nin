function bootstrap() {

  var renderer = new THREE.WebGLRenderer({maxLights: 10, antialias: true});
  renderer.setClearColor(0x000000, 1);
  renderer.sortObjects = false;
  renderer.autoClear = false;

  var lm;

  Loader.loadAjax('res/layers.json', function(layers) {
    lm = new LayerManager(JSON.parse(layers));
    lm.initialize();
  });

  function update(frame) {
    lm.update(frame);
  }

  function render(renderer, interpolation) {
    renderer.clear();
    lm.render(renderer, interpolation);
  }

  function resize() {
    if(window.innerWidth / window.innerHeight > 16 / 9){
      GU = (window.innerHeight / 9);
    }else{
      GU = (window.innerWidth / 16);
    }
    renderer.setSize(16 * GU, 9 * GU);
    renderer.domElement.style.zIndex = 10;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.margin = ((window.innerHeight - 9 * GU) / 2) +
      "px 0 0 " + ((window.innerWidth - 16 * GU) / 2) + "px";
  };

  window.addEventListener('resize', resize);

  var music = document.createElement('audio');
  Loader.load('res/music.mp3', music); 

  var loop = createLoop({
    render: render,
    update: update,
    renderer: renderer,
    music: music
  });  

  resize();

  Loader.start(function progress(percent){
    console.log(percent, 'percent complete!');
  }, function finished(){
    console.log('finished loading :)');  
  });

  return function start() {
    document.body.appendChild(renderer.domElement);
    music.play();
    loop();
  }
}
