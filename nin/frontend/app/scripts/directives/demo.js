angular.module('nin').directive('demo', function(demo) {
  return {
    restrict: 'E',
    template: '<div class=demo-container></div>',
    link: function(scope, element, attrs) {
      demo.setContainer(element[0].children[0]);

      var rect = element[0].children[0].getBoundingClientRect();
      setInterval(function() {
        var newRect = element[0].children[0].getBoundingClientRect();
        if(newRect.width != rect.width || newRect.height != rect.height) {
          rect = newRect;
          demo.resize();
        }
      }, 100);

      setTimeout(function(){
        demo.start();
        demo.music.pause();
      }, 0);
    }
  };
});
