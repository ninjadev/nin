window.THREE = require('./lib/00_three');
require('./lib/OBJLoader');

const NIN = window['NIN'] = window['NIN'] || {}; 
NIN.Input = require('./input');
NIN.TextureInput = require('./TextureInput');

NIN.Output = require('./output');
NIN.TextureOutput = require('./TextureOutput');

NIN.Node = require('./node');
NIN.TextureNode = require('./TextureNode');
NIN.RootNode = require('./RootNode');
NIN.THREENode = require('./THREENode');
NIN.ShaderNode = require('./ShaderNode');
const FullscreenRenderTargetPool = require('./FullscreenRenderTargetPool');
NIN.FullscreenRenderTargetPool = new FullscreenRenderTargetPool();

const {initBeatBean, updateBeatBean} = require('./BEATBEAN');
window.initBeatBean = initBeatBean;
window.updateBeatBean = updateBeatBean;

const {lerp, clamp, smoothstep, easeIn, easeOut, elasticOut} = require('./interpolations');
window.lerp = lerp;
window.clamp = clamp;
window.smoothstep = smoothstep;
window.easeIn = easeIn;
window.easeOut = easeOut;
window.elasticOut = elasticOut;

const {requestAnimFrame, makeFullscreen, audioContext} = require('./shims.js');
window.requestAnimFrame = requestAnimFrame;
window.makeFullscreen = makeFullscreen;
window.audioContext = audioContext;

window.Random = require('./Random');
window.PathController = require('./PathController');
window.CameraController = require('./CameraController');
window.Loader = require('./Loader');
window.createLoop = require('./loop');
window.loadMusic = require('./music');
window.NodeManager = require('./NodeManager');

window['bootstrap'] = function(options) {
  options = options || {};

  var demo = {};
  window.demo = demo;

  var container = document.body;

  demo.renderer = new THREE.WebGLRenderer({maxLights: 10, antialias: true, alpha: true});
  demo.renderer.setClearColor(0x000000, 0);
  demo.renderer.sortObjects = true;
  demo.renderer.autoClear = false;

  Loader.setRootPath(options.rootPath || '');

  window.initBeatBean();

  demo.nm = new NodeManager(demo);

  demo.setContainer = function(c) {
    container = c;
  };

  if(options.graph) {
    let graph = options.graph;
    for (let nodeInfo of graph) {
      let node = demo.nm.createNode(nodeInfo);
      demo.nm.insertOrReplaceNode(node);
      console.log('inserting', node);
    }

    for (let nodeInfo of graph) {
      for (let inputName in nodeInfo.connected) {
        let fromNodeId = nodeInfo.connected[inputName].split('.')[0];
        let toNodeId = nodeInfo.id;
        let outputName = nodeInfo.connected[inputName].split('.')[1];
        demo.nm.connect(
          fromNodeId,
          outputName,
          toNodeId,
          inputName);
      }
    }
  }

  var currentFrame = 0;

  demo.update = function(frame) {
    currentFrame = frame;
    demo.nm.beforeUpdate(frame);
    demo.nm.update(frame);
  };

  demo.render = function(renderer) {
    renderer.clear(true, true, true);
    demo.nm.render(renderer);
  };

  demo.resize = function(width, height) {
    const [x, y] = PROJECT.aspectRatio.split(':').map(n => +n);
    var rect = container.getBoundingClientRect();
    width = width || rect.width;
    height = height || rect.height;
    if (width / height > x / y) {
      GU = (height / y);
    } else {
      GU = (width / x);
    }
    demo.renderer.setSize(x * GU, y * GU);
    demo.renderer.domElement.style.zIndex = 10;
    demo.renderer.domElement.style.position = 'absolute';
    demo.renderer.domElement.style.margin = ((rect.height - y * GU) / 2) +
      'px 0 0 ' + ((rect.width - x * GU) / 2) + 'px';
    demo.nm.resize();
    demo.update(currentFrame);
    demo.render(demo.renderer, 0);
  };

  window.addEventListener('resize', function() {
    demo.resize();
  });
  demo.resize();

  demo.music = loadMusic();

  demo.looper = createLoop(demo);

  demo.getCurrentFrame = function() {
    return currentFrame;
  };

  demo.jumpToFrame = function(frame) {
    var time = (frame / 60) * 1000;
    if (time > demo.music.getDuration() * 1000) {
      time = demo.music.getDuration() * 1000;
      frame = (time / 1000) * 60 | 0;
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
    window.updateBeatBean(frame);
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
    demo.nm.warmup(demo.renderer);
  }

  return demo;
};
