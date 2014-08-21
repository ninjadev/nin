angular.module('nin').service('render', function(demo, socket) { 

  var currentFrame;

  function render(i) {
    i = i || 0;
    currentFrame = i;
    demo.update(i);
    demo.render(demo.renderer, 0);
    var image = demo.renderer.domElement.toDataURL('image/png');
    socket.send(JSON.stringify({
      type: 'render-frame',
      image: image,
      frame: i
    }));
  }

  socket.on('frame-received', function() {
    render(currentFrame + 1);
  });

  return render;
});

