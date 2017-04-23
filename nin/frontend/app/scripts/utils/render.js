const demo = require('../demo');
const commands = require('../commands');

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
  demo.jumpToFrame(i);
  const currentFrame = demo.getCurrentFrame();
  if (currentFrame < i) {
    currentlyRendering = false;
    return;
  }

  const image = demo.renderer.domElement.toDataURL('image/png');

  fetch('http://localhost:9000/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'render-frame',
      image: image,
      frame: currentFrame,
    })
  });

  if (currentlyRendering) {
    currentTimeout = setTimeout(() => {
      render(currentFrame + 1);
    }, 0);
  }
}
