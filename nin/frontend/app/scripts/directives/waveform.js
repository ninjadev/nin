'use strict';

angular.module('nin').directive('waveform', function() {
  return {
    restrict: 'A',
    template: '<div class=under></div>' +
              '<div class=over style="width:{{ currentFrame }}px"></div>',
    link: function(scope, element, attrs) {

      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      var context = new AudioContext();

      var waveform;
      var waveformOverlay;
      var request = new XMLHttpRequest();
      request.open('GET', '//localhost:9999/res/music.mp3', true);
      request.responseType = 'arraybuffer';
      request.onload = function() {
        context.decodeAudioData(request.response, function(buffer) {
          var channelData = buffer.getChannelData(1);
            waveform = new Waveform({
            container: element[0].children[0],
            height: 50,
            width: attrs.duration,
            interpolate: true,
            innerColor: '#3b4449',
            outerColor: '#888',
            data: channelData
          });
            waveformOverlay = new Waveform({
            container: element[0].children[1],
            height: 50,
            width: attrs.duration,
            interpolate: true,
            innerColor: '#f3c656',
            outerColor: '#283136',
            data: channelData
          });
        });
      };
      request.send();
    }
  };
});
