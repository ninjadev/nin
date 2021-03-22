const commands = require("./commands");

const demo = bootstrap({
  rootPath: "/project/",
});

window.demo = demo;

var originalLoop = demo.looper.loop;
var forcedPause = false;

let updateTime = 0;
let renderTime = 0;

class Stats {
  constructor() {
    const container = document.createElement("div");
    const canvas = document.createElement("canvas");
    const text = document.createElement("div");
    this.text = text;
    container.appendChild(canvas);
    container.appendChild(text);
    canvas.height = 64;
    canvas.width = 128;
    container.style.width = "128px";
    container.style.height = "64px";
    container.classList.add("frame-panel");
    container.style.position = "fixed";
    container.style.right = "30px";
    container.style.bottom = "85px";
    container.setAttribute(
      "title",
      "Green: update. Gray: render. Target: 1000/60 ms."
    );
    this.canvas = canvas;
    this.container = container;
    this.ctx = canvas.getContext("2d");
    text.style.position = "absolute";
    text.style.left = "8px";
    text.style.bottom = "8px";
    text.style.color = "white";

    this.skippedRenderedFramesLog = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ];
    this.skippedRenderedFramesIndex = 0;
  }

  render() {
    this.skippedRenderedFramesLog[this.skippedRenderedFramesIndex] =
      demo.looper.skippedRenderedFrames;
    this.skippedRenderedFramesIndex =
      (this.skippedRenderedFramesIndex + 1) %
      this.skippedRenderedFramesLog.length;
    let avg = 0;
    for (let i = 0; i < this.skippedRenderedFramesLog.length; i++) {
      avg += this.skippedRenderedFramesLog[i];
    }
    avg /= this.skippedRenderedFramesLog.length;

    this.ctx.drawImage(this.canvas, -1, 0);
    this.ctx.fillStyle = "rgb(30, 41, 48)";
    this.ctx.fillRect(this.canvas.width - 1, 0, 1, this.canvas.height);

    this.ctx.fillStyle = "rgb(52, 68, 78)";
    this.ctx.fillRect(
      this.canvas.width - 1,
      this.canvas.height - (((1000 / 60) * 3) | 0),
      1,
      1
    );

    let updateColor = "#4cd964";
    let renderColor = "#596267";

    renderTime = 0;
    if (demo.looper.skippedRenderedFrames > 0) {
      renderTime = 100;
    }
    if ((updateTime + renderTime > 1000 / 60) | 0) {
      updateColor = "#ff3b30";
      renderColor = "#ff2d55";
    }

    this.ctx.fillStyle = updateColor;
    this.ctx.fillRect(
      this.canvas.width - 1,
      this.canvas.height - updateTime * 3,
      1,
      updateTime * 3
    );

    this.ctx.fillStyle = renderColor;
    this.ctx.fillRect(
      this.canvas.width - 1,
      this.canvas.height - (renderTime + updateTime) * 3,
      1,
      renderTime * 3
    );

    const fps = (60 / (avg + 1)) | 0;
    this.text.innerText = fps;
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(
      this.canvas.width - 1,
      (this.canvas.height - fps) | 0,
      1,
      1
    );
  }
}

const stats = new Stats();
document.body.appendChild(stats.container);

commands.on("toggleStats", () => {
  stats.container.style.display =
    stats.container.style.display === "none" ? "block" : "none";
});

const originalUpdate = demo.update;
const originalRender = demo.render;
demo.update = function (frame) {
  const now = performance.now();
  originalUpdate(frame);
  updateTime = performance.now() - now;
};

demo.render = function (renderer) {
  originalRender(renderer);
  stats.render();
};

let main;

demo.registerMainComponent = function (mainComponent) {
  main = mainComponent;
};

let looperTimestamp = performance.now();

demo.looper.loop = function () {
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
    if (globalShaderErrors.shader) {
      delete globalShaderErrors.shader;
      shaderErrorsChanged = true;
    }
    for (let i = 0; i < demo.renderer.info.programs.length; i++) {
      const program = demo.renderer.info.programs[i];
      if (program.diagnostics && !program.diagnostics.runnable) {
        globalShaderErrors.shader = program;
        shaderErrorsChanged = true;
      }
    }
    if (shaderErrorsChanged) {
      main.setState({ globalShaderErrors });
    }

    if (main.state.globalJSErrors.looper) {
      const globalJSErrors = Object.assign({}, main.state.globalJSErrors);
      delete globalJSErrors.looper;
      main.setState({ globalJSErrors });
    }
  } catch (e) {
    e.context = "Error during looping of demo";
    const globalJSErrors = Object.assign({}, main.state.globalJSErrors);
    globalJSErrors.looper = e;
    main.setState({ globalJSErrors });

    demo.looper.deltaTime += demo.looper.frameLength;
    demo.looper.currentFrame -= 1;

    if (!demo.music.paused) {
      demo.music.pause();
      forcedPause = true;
    }

    requestAnimFrame(demo.looper.loop);
  }
};

commands.on("playPause", function () {
  if (demo.music.paused) {
    demo.music.play();
  } else {
    demo.music.pause();
  }
});

commands.on("pause", function () {
  demo.music.pause();
});

commands.on("jog", function (amount) {
  demo.jumpToFrame(demo.getCurrentFrame() + amount);
});

commands.on("quantizedJog", function (bars, beats) {
  beats = beats || 0;
  let offset = BEAN % PROJECT.music.subdivision;
  let barOffset = BEAN % (PROJECT.music.subdivision * 4);
  if (bars == 0) {
    barOffset = 0;
  } else {
    offset = 0;
  }
  if (barOffset > 0 && bars < 0) {
    bars += 1;
  }
  if (offset > 0 && beats < 0) {
    beats += 1;
  }
  beats += bars * 4;
  const targetBean =
    BEAN - offset - barOffset + beats * PROJECT.music.subdivision;
  demo.jumpToFrame(FRAME_FOR_BEAN(targetBean));
});

commands.on("jumpToFrame", function (frame) {
  demo.jumpToFrame(frame);
});

commands.on("setPlaybackRate", function (rate) {
  demo.music.setPlaybackRate(rate);
});

var showCameraPathVisualizations = false;
commands.on("toggleCameraPathVisualizations", function () {
  var showCameraPathVisualizations = !showCameraPathVisualizations;
  demo.lm.showCameraPathVisualizations(showCameraPathVisualizations);
});

module.exports = demo;
