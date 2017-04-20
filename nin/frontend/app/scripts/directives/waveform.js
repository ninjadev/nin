const Waveform = require('../../lib/waveform');

function waveform($window) {

  const white = '#d3dde3';
  const grey = 'rgb(42, 62, 72)';
  const pixelSize = 1 / window.devicePixelRatio;
  const beatOffset = (PROJECT.music.beatOffset || 0);
  console.log(PROJECT.music);

  const gradientArguments = [];
  gradientArguments.push('90deg');

  const lineColorA = '#0a1a24';
  const lineColorB = '#22323c';
  const backgroundColorA = '#34444e';
  const backgroundColorB = '#2e3e48';

  for(let i = 0; i < 32; i++) {
    const lineColor = i % 4 == 0 ? lineColorA : lineColorB;
    const backgroundColor = i % 32 >= 16 ? backgroundColorA : backgroundColorB;
    if(i % 4 == 0) {
      gradientArguments.push(`${lineColor} {{beatLength * ${i}}}px`);
      gradientArguments.push(`${lineColor} {{beatLength * ${i} + ${pixelSize}}}px`);
    }
    gradientArguments.push(`${backgroundColor} {{beatLength * ${i} + ${pixelSize}}}px`);
    gradientArguments.push(`${backgroundColor} {{beatLength * ${i + 1}}}px`);
  }

  console.log(gradientArguments);

  return {
    restrict: 'A',
    template: `<div style="
      height: 100%;
      background-image: repeating-linear-gradient(${gradientArguments.join(',')});
      background-position: {{beatLength * ${beatOffset}}}px;
      ">`,
    link: function(scope, element, attrs) {

      $window.AudioContext = $window.AudioContext || $window.webkitAudioContext;
      var context = new AudioContext();
      scope.$watch('main.duration', duration => {
        console.log(duration, attrs, attrs.xscale);
        scope.beatLength = duration * attrs.xscale / (duration / 60 / 60 * PROJECT.music.bpm);
      });

      scope.$watch('selectedTheme', function() {
        var innerColor = '';
        if(scope.main.selectedTheme == 'dark') {
          innerColor = lineColorA;
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
                container: element[0],
                height: 50,
                width: duration,
                interpolate: true,
                innerColor: innerColor,
                outerColor: 'rgba(0, 0, 0, 0)',
                data: channelData
              });
              waveform.canvas.style.position = 'absolute';
              waveform.canvas.style.top = '0px';
            });
          };
          request.send();
        }
      });
    }
  };
}

module.exports = waveform;
