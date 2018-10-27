const commands = require('./commands');

const demo = bootstrap({
  rootPath: '/project/',
});

window.demo = demo;

var originalLoop = demo.looper.loop;
var forcedPause = false;

let updateTime = 0;
let renderTime = 0;

class Stats {
  constructor() {
    const canvas = document.createElement('canvas');
    canvas.height = 64;
    canvas.width = 128;
    canvas.classList.add('frame-panel');
    canvas.style.position = 'fixed';
    canvas.style.right = '30px';
    canvas.style.bottom = '85px';
    canvas.setAttribute('title', 'Green: update. Gray: render. Target: 1000/60 ms.');
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  render() {
    this.ctx.drawImage(this.canvas, -1, 0);
    this.ctx.fillStyle = 'rgb(30, 41, 48)';
    this.ctx.fillRect(this.canvas.width - 1, 0, 1, this.canvas.height);

    this.ctx.fillStyle = 'rgb(52, 68, 78)';
    this.ctx.fillRect(this.canvas.width - 1, this.canvas.height - (1000 / 60 * 3 | 0), 1, 1);

    let updateColor = '#4cd964';
    let renderColor = '#596267';
    if((updateTime + renderTime) > 1000 / 60 | 0) {
      updateColor = '#ff3b30';
      renderColor = '#ff2d55';
    }

    this.ctx.fillStyle = updateColor;
    this.ctx.fillRect(this.canvas.width - 1, this.canvas.height - updateTime * 3, 1, updateTime * 3);

    this.ctx.fillStyle = renderColor;
    this.ctx.fillRect(this.canvas.width - 1, this.canvas.height - (renderTime + updateTime) * 3, 1, renderTime * 3);
  }
}

const stats = new Stats();
document.body.appendChild(stats.canvas);


commands.on('toggleStats', () => {
  stats.canvas.style.display = stats.canvas.style.display === 'none' ? 'block' : 'none';
});



const originalUpdate = demo.update;
const originalRender = demo.render;
demo.update = function(frame) {
  const now = performance.now();
  originalUpdate(frame);
  updateTime = performance.now() - now;
};

demo.render = function(renderer) {
  const now = performance.now();
  originalRender(renderer);
  renderTime = performance.now() - now;
  stats.render();
};

let main;

demo.registerMainComponent = function(mainComponent) {
  main = mainComponent;
};


demo.looper.loop = function() {
  try {
    originalLoop();

    if (forcedPause) {
      demo.music.play();
      forcedPause = false;
    }

    /* Since we have no nice way of figuring out which shader on disk this is,
     * we only support a single shader error called 'shader'. Luckily, this
     * covers 99.9% percent of all use-cases, where we only have one shader
     * error at a time anyway. */
    const globalShaderErrors = Object.assign({}, main.state.globalShaderErrors);
    let shaderErrorsChanged = false;
    if(globalShaderErrors.shader) {
      delete globalShaderErrors.shader;
      shaderErrorsChanged = true;
    }
    for(let i = 0; i < demo.renderer.info.programs.length; i++) {
      const program = demo.renderer.info.programs[i];
      if(program.diagnostics && !program.diagnostics.runnable) {
        globalShaderErrors.shader = program;
        shaderErrorsChanged = true;
      }
    }
    if(shaderErrorsChanged) {
      main.setState({globalShaderErrors});
    }

    if(main.state.globalJSErrors.looper) {
      const globalJSErrors = Object.assign({}, main.state.globalJSErrors);
      delete globalJSErrors.looper;
      main.setState({globalJSErrors});
    }
  } catch(e) {
    e.context = "Error during looping of demo";
    const globalJSErrors = Object.assign({}, main.state.globalJSErrors);
    globalJSErrors.looper = e;
    main.setState({globalJSErrors});

    demo.looper.deltaTime += demo.looper.frameLength;
    demo.looper.currentFrame -= 1;

    if (!demo.music.paused) {
      demo.music.pause();
      forcedPause = true;
    }

    requestAnimFrame(demo.looper.loop);
  }
};

commands.on('playPause', function() {
  if(demo.music.paused) {
    demo.music.play();
  } else {
    demo.music.pause();
  }
});

commands.on('pause', function() {
  demo.music.pause();
});

commands.on('jog', function(amount) {
  demo.jumpToFrame(demo.getCurrentFrame() + amount);
});

commands.on('quantizedJog', function(bars, beats) {
  beats = beats || 0;
  let offset = BEAN % PROJECT.music.subdivision;
  let barOffset = BEAN % (PROJECT.music.subdivision * 4);
  if(bars == 0) {
    barOffset = 0;
  } else {
    offset = 0;
  }
  if(barOffset > 0 && bars < 0) {
    bars += 1;
  }
  if(offset > 0 && beats < 0) {
    beats += 1;
  }
  beats += bars * 4;
  const targetBean = BEAN - offset - barOffset + beats * PROJECT.music.subdivision;
  demo.jumpToFrame(FRAME_FOR_BEAN(targetBean));
});

commands.on('jumpToFrame', function(frame) {
  demo.jumpToFrame(frame);
});

commands.on('setPlaybackRate', function(rate) {
  demo.music.setPlaybackRate(rate);
});

var showCameraPathVisualizations = false;
commands.on('toggleCameraPathVisualizations', function() {
  var showCameraPathVisualizations = !showCameraPathVisualizations;
  demo.lm.showCameraPathVisualizations(showCameraPathVisualizations);
});

module.exports = demo;
