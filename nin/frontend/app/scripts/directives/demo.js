function demo($interval, demo, $timeout) {
  return {
    restrict: 'E',
    template: '<div class=demo-container><img src="images/overlay.png" class="overlay" /></div>',
    link: function(scope, element) {
      demo.setContainer(element[0].children[0]);
      $timeout(function() {
        demo.resize();
      });

      const overlayElement = element[0].querySelector('.overlay');
      window.addEventListener('resize', resizeOverlay);

      function resizeOverlay() {
        const rect = element[0].getBoundingClientRect();
        let width = 0;
        let height = 0;
        if(rect.width / rect.height < 16 / 9) {
          width = rect.width;
          height = width / 16 * 9;
        } else {
          height = rect.height;
          width = height / 9  * 16;
        }
        overlayElement.style.width = `${width}px`;
        overlayElement.style.height = `${height}px`;
        overlayElement.style.left = `${(rect.width - width) / 2}px`;
      }

      resizeOverlay();

      scope.$watch(() => scope.main.showFramingOverlay, function (showFramingOverlay){
        if (showFramingOverlay) {
          overlayElement.style.display = 'block';
        } else {
          overlayElement.style.display = 'none';
        }
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
        resizeOverlay();
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
        demo.music.pause();
        demo.jumpToFrame(0);
      }, 0);
    }
  };
}

module.exports = demo;
