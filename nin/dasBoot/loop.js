function createLoop(options) {
  var frameLength = 1000 / (options.frameRateInHz || 60);
  var currentFrame = 0;
  var render = options.render;
  var update = options.update;
  var renderer = options.renderer;
  var music = options.music;
  var time = oldTime = deltaTime = 0;

  return function loop() {
    time = music.currentTime * 1000;
    deltaTime += time - oldTime;
    oldTime = time;
    while(deltaTime >= frameLength) {
      update(currentFrame++);
      deltaTime -= frameLength;
    }
    render(renderer, deltaTime / frameLength);
    requestAnimFrame(loop);
  };
}
