const THREE = window['THREE'] = require('./lib/00_three');
require('./lib/01_EffectComposer');
require('./lib/BloomPass');
require('./lib/ClearPass');
require('./lib/ConvolutionShader');
require('./lib/CopyShader');
require('./lib/ImprovedNoise');
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

const {initBeatBean, updateBeatBean} = require('./BEATBEAN');
window['initBeatBean'] = initBeatBean;
window['updateBeatBean'] = updateBeatBean;

const {lerp, clamp, smoothstep, easeIn, easeOut} = require('./interpolations');
window['lerp'] = lerp;
window['clamp'] = clamp;
window['smoothstep'] = smoothstep;
window['easeIn'] = easeIn;
window['easeOut'] = easeOut;

const {requestAnimFrame, makeFullscreen} = require('./shims.js');
window['requestAnimFrame'] = requestAnimFrame;
window['makeFullscreen'] = makeFullscreen;

window['Random'] = require('./Random');
window['PathController'] = require('./PathController');
const Loader = window['Loader'] = require('./Loader');
const loadMusic = require('./music');
const NodeManager = window['NodeManager'] = require('./NodeManager');

window['bootstrap'] = function(options) {
  options = options || {};

  var demo = {};
  window['demo'] = demo;

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
      window.GU = (height / 9);
    } else {
      window.GU = (width / 16);
    }
    demo.renderer.setSize(16 * window.GU, 9 * window.GU);
    demo.renderer.domElement.style.zIndex = 10;
    demo.renderer.domElement.style.position = 'absolute';
    demo.renderer.domElement.style.margin = ((rect.height - 9 * window.GU) / 2) +
      'px 0 0 ' + ((rect.width - 16 * window.GU) / 2) + 'px';
    demo.nm.resize();
    demo.update(currentFrame);
    demo.render(demo.renderer, 0);
  };

  window.addEventListener('resize', function() {
    demo.resize();
  });
  demo.resize();

  demo.music = loadMusic();

  function createLoop(options) {
    var frameLength = 1000 / (options.frameRateInHz || 60);
    var render = options.render;
    var update = options.update;
    var renderer = options.renderer;
    var music = options.music;

    function Looper() {
      this.time = 0;
      this.oldTime = 0;
      this.deltaTime = 0;
      this.currentFrame = 0;
      this.frameLength = frameLength;

      var that = this;
      this.loop = function() {
        that.time = music.getCurrentTime() * 1000;
        that.deltaTime += that.time - that.oldTime;
        that.oldTime = that.time;
        while (that.deltaTime >= frameLength) {
          that.deltaTime -= frameLength;
          demo.music._calculateFFT();
          updateBeatBean(that.currentFrame);
          update(that.currentFrame++);
        }
        render(renderer, that.deltaTime / frameLength);
        requestAnimFrame(that.loop);
      };
    }

    return new Looper();
  }

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
    demo.nm.warmup();
  }

  return demo;
};
