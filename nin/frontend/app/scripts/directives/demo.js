(function() {
  'use strict';

  angular.module('nin').directive('demo', function($interval, demo) {
    return {
      restrict: 'E',
      template: '<div class=demo-container></div>',
      link: function(scope, element) {
        demo.setContainer(element[0].children[0]);
        setTimeout(function() {
          demo.resize();
        });

        scope.$watch('fullscreen', function (toFullscreen){
          if (toFullscreen) {
            // go to fullscreen
            document.body.classList.add('fullscreen');
          } else {
            // exit fullscreen
            document.body.classList.remove('fullscreen');
          }
          demo.resize();
        });

        scope.$watch('mute', function (toMute) {
          if (toMute) {
            demo.music.setVolume(0);
          } else {
            demo.music.setVolume(scope.volume);
          }
        });

        scope.$watch('volume', function(volume) {
          if (scope.mute) return;
          demo.music.setVolume(volume);
        });

        $interval(function() {
          scope.$parent.$parent.currentFrame = demo.getCurrentFrame();
          scope.$parent.$parent.duration = demo.music.getDuration() * 60;
        }, 1000 / 60);

        setTimeout(function(){
          demo.start();
          demo.music.pause();
          demo.jumpToFrame(0);
        }, 0);
      }
    };
  });
})();
