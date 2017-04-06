function demo($interval, demo, $timeout, commands) {
  return {
    restrict: 'E',
    template: '<div class=demo-container></div>',
    link: function(scope, element) {
      demo.setContainer(element[0].children[0]);
      $timeout(function() {
        demo.resize();
      });

      scope.$watch(() => scope.main.fullscreen, function (toFullscreen){
        if (toFullscreen) {
          // go to fullscreen
          document.body.classList.add('fullscreen');
        } else {
          // exit fullscreen
          document.body.classList.remove('fullscreen');
        }
        demo.resize();
      });

      scope.$watch(() => scope.main.mute, function (toMute) {
        if (toMute) {
          demo.music.setVolume(0);
        } else {
          demo.music.setVolume(scope.main.volume);
        }
      });

      scope.$watch(() => scope.main.volume, volume => {
        if (scope.main.mute) return;
        demo.music.setVolume(volume);
      });

      $interval(function() {
        scope.main.currentFrame = demo.getCurrentFrame();
        scope.main.duration = demo.music.getDuration() * 60;
      }, 1000 / 60);

      $timeout(function(){
        demo.start();
      }, 0);
    }
  };
}

module.exports = demo;
