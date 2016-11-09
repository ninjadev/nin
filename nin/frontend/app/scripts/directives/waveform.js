const Waveform = require('../../lib/waveform');

function waveform($window) {
  return {
    restrict: 'A',
    template: '<div class=under style="width:{{ currentFrame * xScale }}px"></div>' +
              '<div class=over></div>',
    link: function(scope, element, attrs) {

      $window.AudioContext = $window.AudioContext || $window.webkitAudioContext;
      var context = new AudioContext();

      scope.$watch('selectedTheme', function() {
        var innerColor = '';
        if(scope.main.selectedTheme == 'dark') {
          innerColor = 'rgb(46, 62, 72)';
        } else if(scope.main.selectedTheme == 'light') {
          innerColor = '#ababab';
        }

        if(innerColor) {
          var waveform;
          var request = new XMLHttpRequest();
          request.open('GET', '//localhost:9000/' + PROJECT.music.path, true);
          request.responseType = 'arraybuffer';
          request.onload = function() {
            context.decodeAudioData(request.response, function(buffer) {
              var channelData = buffer.getChannelData(1);
              var duration = channelData.length / 44100 * 60;
              waveform = new Waveform({
                container: element[0].children[1],
                height: 50,
                width: duration,
                interpolate: true,
                innerColor: innerColor,
                outerColor: 'rgba(0, 0, 0, 0)',
                data: channelData
              });
            });
          };
          request.send();
        }
      });
    }
  };
}

module.exports = waveform;
