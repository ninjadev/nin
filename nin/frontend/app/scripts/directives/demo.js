'use strict';

angular.module('nin').directive('demo', function($interval, demo) {
  return {
    restrict: 'E',
    template: '<div class=demo-container></div>',
    link: function(scope, element) {
      demo.setContainer(element[0].children[0]);

      var rect = element[0].children[0].getBoundingClientRect();
      $interval(function() {
        var newRect = element[0].children[0].getBoundingClientRect();
        if(newRect.width != rect.width || newRect.height != rect.height) {
          rect = newRect;
          demo.resize();
        }
      }, 100);

      $interval(function() {
        scope.currentFrame = demo.getCurrentFrame();
        scope.duration = demo.music.duration * 60;
      }, 1000 / 60);

      setTimeout(function(){
        demo.start();
        demo.music.pause();
      }, 0);
    }
  };
});
