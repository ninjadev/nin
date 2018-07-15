const Stats = require('../lib/stats.min.js');
const commands = require('./commands');

const demo = bootstrap({
  rootPath: '/project/',
});

window.demo = demo;

var originalLoop = demo.looper.loop;
var forcedPause = false;
const stats = [];
const statsContainer = document.createElement('div');
document.body.appendChild(statsContainer);
statsContainer.style.position = 'fixed';
statsContainer.style.bottom = '80px';
statsContainer.style.right = '30px';
for(let i = 0; i < 3; i++) {
  stats[i] = Stats();
  stats[i].showPanel(2 - i);
  statsContainer.appendChild(stats[i].dom);
  stats[i].dom.style.position = 'static';
  stats[i].dom.style.float = 'right';
  stats[i].dom.style.display = 'block';
}

commands.on('toggleStats', () => {
  for(let i = 0; i < 3; i++) {
    stats[i].dom.style.display = stats[i].dom.style.display == 'none' ? 'block' : 'none';
  }
});

let main;

demo.registerMainComponent = function(mainComponent) {
  main = mainComponent;
};


demo.looper.loop = function(time) {
  try {
    for(let i = 0; i < 3; i++) {
      stats[i].begin();
    }
    originalLoop(time);
    for(let i = 0; i < 3; i++) {
      stats[i].end();
    }

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
    console.log('error', e);
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
