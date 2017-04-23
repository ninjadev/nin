const demo = require('../demo');
const commands = require('../commands');

let currentFrame;
let currentlyRendering = false;
let currentTimeout;

commands.on('startRendering', () => {
  demo.resize(1920, 1080);
  currentlyRendering = true;
  render(demo.getCurrentFrame());
});

commands.on('stopRendering', () => {
  demo.resize();
  currentlyRendering = false;
  clearTimeout(currentTimeout);
});

function render(i) {
  i = i || 0;
  currentFrame = i;
  demo.jumpToFrame(i);
  const image = demo.renderer.domElement.toDataURL('image/png');

  fetch('/render', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'render-frame',
      image: image,
      frame: i
    })
  });

  if (currentlyRendering) {
    currentTimeout = setTimeout(() => {
      render(currentFrame + 1);
    }, 0);
  }
}
