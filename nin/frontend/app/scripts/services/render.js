angular.module('nin').service('render', function(demo, $http) { 

  var currentFrame;

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

    setTimeout(function() {
      render(currentFrame + 1);
    }, 0);
  }

  return render;
});

