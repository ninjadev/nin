window.THREE = require('./lib/00_three');
require('./lib/01_EffectComposer');
require('./lib/BloomPass');
require('./lib/ClearPass');
require('./lib/ConvolutionShader');
require('./lib/CopyShader');
require('./lib/MaskPass');
require('./lib/MTLLoader');
require('./lib/OBJLoader');
require('./lib/RenderPass');
require('./lib/ShaderPass');

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

NIN.ImprovedNoise = require('./lib/ImprovedNoise');

const {initBeatBean, updateBeatBean} = require('./BEATBEAN');
window.initBeatBean = initBeatBean;
window.updateBeatBean = updateBeatBean;

const {lerp, clamp, smoothstep, easeIn, easeOut} = require('./interpolations');
window.lerp = lerp;
window.clamp = clamp;
window.smoothstep = smoothstep;
window.easeIn = easeIn;
window.easeOut = easeOut;

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

  initBeatBean();

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
    demo.nm.warmup(demo.renderer);
  }

  return demo;
};
