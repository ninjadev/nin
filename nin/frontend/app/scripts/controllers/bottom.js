(function() {
  'use strict';

  angular.module('nin')
    .controller('BottomCtrl', function ($scope, $interval, socket, camera, commands) {

      $scope.xScale = 1;

      function updateLayerBackgroundGradientStyle() {
        if(!$scope.selectedTheme) {
          return;
        }
        var wellBgColor;
        var wellBgColorAlt;
        var wellBgBorderColor;
        if($scope.selectedTheme == 'dark') {
          wellBgColor = 'rgb(52, 68, 78)';
          wellBgColorAlt = 'rgb(46, 62, 72)';
          wellBgBorderColor = 'rgb(10, 26, 36)';
        } else if($scope.selectedTheme == 'light') {
          wellBgColor = '#efefef';
          wellBgColorAlt = '#dfdfdf';
          wellBgBorderColor = '#ababab';
        }

        var beatsPerSecond = PROJECT.music.bpm / 60;
        var secondsPerBeat = 1 / beatsPerSecond;
        var framesPerSecond = 60;
        var framesPerBeat = secondsPerBeat * framesPerSecond;
        var beatWidthInPixels = framesPerBeat * $scope.xScale;
        var devicePixelRatio = window.devicePixelRatio || 1;

        var entirePatternRepeatCount = 6;
        var backgroundWidth = beatWidthInPixels * 8 * devicePixelRatio;
        var repeatedBackgroundWidth = backgroundWidth * entirePatternRepeatCount;

        var backgroundCanvas = document.createElement('canvas');
        var ctx = backgroundCanvas.getContext('2d');
        backgroundCanvas.width = repeatedBackgroundWidth;
        backgroundCanvas.height = 1;
        for(var i = 0; i < entirePatternRepeatCount; i++) {
          var entirePatternRepeatOffset = i * backgroundWidth;
          ctx.fillStyle = wellBgColor;
          ctx.fillRect(entirePatternRepeatOffset, 0,
                       backgroundWidth, 1);
          ctx.fillStyle = wellBgColorAlt;
          ctx.fillRect(entirePatternRepeatOffset + backgroundWidth / 2, 0,
                       backgroundWidth, 1);
          ctx.fillStyle = wellBgBorderColor;
          for(var j = 0; j < 8; j++) {
            ctx.fillRect(entirePatternRepeatOffset + j * backgroundWidth / 8, 0,
                         1, 1);
          }
        }
        $scope.backgroundImageDataUrl = backgroundCanvas.toDataURL();
        $scope.backgroundWidth = repeatedBackgroundWidth / devicePixelRatio;
      }

      updateLayerBackgroundGradientStyle();

      $scope.$watch('xScale', function() {
        updateLayerBackgroundGradientStyle();
      });

      $scope.$watch('selectedTheme', function() {
        updateLayerBackgroundGradientStyle();
      });

      $scope.$watch('duration', updateXScale);
      window.addEventListener('resize', function() {
        $scope.$apply(updateXScale);
      });

      function updateXScale() {
        var rect = $('body')[0].getBoundingClientRect();
        $scope.xScale = rect.width / $scope.duration;
      }

      function getClickOffset($event) {
        var target = $('.layers-bar-container')[0];
        var rect = target.getBoundingClientRect();
        var offsetX = ($event.clientX - rect.left) | 0;
        var offsetY = ($event.clientY - rect.top) | 0;
        return {x: offsetX, y: offsetY};
      }

      function getScrollOffset($event) {
        var target = $('.layers-bar-container')[0];
        return target.getBoundingClientRect();
      }

      $scope.musicLayerClick = function($event) {
        $scope.demo.jumpToFrame(getClickOffset($event).x / $scope.xScale | 0);
      };

      $scope.$window = window;

      $scope.relativeBEAN = function() {
        return window.BEAN - BEAN_FOR_FRAME($scope.inspectedLayer.startFrame);
      };

      $scope.inspectLayer = function(layer) {
        $scope.$parent.$parent.inspectedLayer = $scope.inspectedLayer == layer ? null
                                                                               : layer;
        camera.startEdit(layer);
      };

      $scope.toggleMinimized = function(layer) {
        layer.minimized = !layer.minimized;
      };

      $scope.loopStart = null;
      $scope.loopEnd = null;
      $scope.loopActive = false;
      commands.on('getCuePoint', function(callback) {
        callback($scope.loopActive ? $scope.loopStart : null);
      });
      commands.on('setCuePoint', function() {
        var currentBEAN = BEAN_FOR_FRAME($scope.currentFrame);
        var currentQuantizedFrame = FRAME_FOR_BEAN(currentBEAN - currentBEAN % PROJECT.music.subdivision);
        if ($scope.loopStart === null) {
          $scope.loopStart = currentQuantizedFrame;
        } else if ($scope.loopEnd === null) {
          if ($scope.loopStart > $scope.currentFrame) {
            $scope.loopEnd = currentQuantizedFrame;
            $scope.loopStart = currentQuantizedFrame;
          } else {
            $scope.loopEnd = currentQuantizedFrame;
          }
          $scope.loopActive = true;
        } else {
          $scope.loopStart = null;
          $scope.loopEnd = null;
          $scope.loopActive = false;
        }
      });

      commands.on('multiplyLoopLengthBy', function(amount) {
        if ($scope.loopEnd === undefined || $scope.loopStart === undefined) {
          return;
        }

        var clampedAmount = Math.max(0, amount),
            loopLength = $scope.loopEnd - $scope.loopStart,
            newLoopLength = Math.max(1, loopLength * clampedAmount);

        $scope.loopEnd = $scope.loopStart + newLoopLength;
      });

      $scope.$watch('currentFrame', function (nextFrame) {
        if ($scope.loopActive && nextFrame >= $scope.loopEnd) {
          $scope.demo.jumpToFrame($scope.loopStart);
        }
      });
    });
})();
