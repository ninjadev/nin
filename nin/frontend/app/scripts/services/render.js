angular.module('nin').service('render', function(demo, $http, commands) {

  var currentFrame;
  var currentlyRendering = false;
  var currentTimeout;

  function render(i) {
    i = i || 0;
    currentFrame = i;
    demo.jumpToFrame(i);
    var image = demo.renderer.domElement.toDataURL('image/png');

    $http.post('http://localhost:9000/', {
        type: 'render-frame',
        image: image,
        frame: i
      });

    if(currentlyRendering) {
      currentTimeout = setTimeout(function() {
        render(currentFrame + 1);
      }, 0);
    }
  }

  render.isCurrentlyRendering = function() {
    return currentlyRendering;
  }

  commands.on('startRendering', function() {
    demo.resize(1920, 1080);
    currentlyRendering = true;
    render(demo.getCurrentFrame());
  });

  commands.on('stopRendering', function() {
    demo.resize();
    currentlyRendering = false;
    cancelTimeout(currentTimeout);
  });

  return render;
});

