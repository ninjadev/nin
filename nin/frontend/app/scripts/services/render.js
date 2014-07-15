angular.module('nin').service('render', function(demo, socket) { 

  function render(i) {
    i = i || 0;
    demo.update(i);
    demo.render(demo.renderer, 0);
    var image = demo.renderer.domElement.toDataURL('image/png');
    socket.send(JSON.stringify({
      type: 'render-frame',
      image: image,
      frame: i
    }));

    setTimeout(function() { render(i + 1); }, 0);
  }

  return render;
});

