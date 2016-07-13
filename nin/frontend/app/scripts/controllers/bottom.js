(function() {
  'use strict';

  angular.module('nin')
    .controller('BottomCtrl', function ($scope, $interval, socket, camera, commands) {

      $scope.xScale = 1;
      $scope.xScaleTarget = 1;
      $scope.yScale = 1;


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

      $scope.$watch('xScaleTarget', updateXScale);
      updateXScale();
      function updateXScale() {
        var target = $('.layers-bar-container');
        var rect = target[0].getBoundingClientRect();
        var parentRect = target.parent()[0].getBoundingClientRect();
        var firstVisibleFrame = -rect.left / $scope.xScale;
        var lastVisibleFrame = (-rect.left + parentRect.width) / $scope.xScale;
        var centerFrame = firstVisibleFrame + (lastVisibleFrame - firstVisibleFrame) / 2;

        var radius = parentRect.width / 2 / $scope.xScaleTarget;
        var newFirstVisibleFrame = centerFrame - radius;
        var newLastVisibleFrame = centerFrame + radius;

        if (newFirstVisibleFrame < 0) {
          newFirstVisibleFrame = 0;
        }

        if(newLastVisibleFrame > rect.width / $scope.xScale) {
          newLastVisibleFrame = rect.width / $scope.xScale;
        }

        if(newLastVisibleFrame === 0) {
          return;
        }
        var newCenterFrame = newFirstVisibleFrame + (newLastVisibleFrame - newFirstVisibleFrame) / 2;
        var newXScaleTarget = parentRect.width / 2 / (newLastVisibleFrame - newCenterFrame) ;
        var newOffsetX = newFirstVisibleFrame * newXScaleTarget;
        $('div.bottom').parent().scrollLeft(newOffsetX);
        $scope.xScale = newXScaleTarget;
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

      $scope.inspectLayer = function(layer) {
        $scope.$parent.$parent.inspectedLayer = $scope.inspectedLayer == layer ? null
                                                                               : layer;
        camera.startEdit(layer);
      };

      $scope.toggleMinimized = function(layer) {
        layer.minimized = !layer.minimized;
      };

      $scope.dragResizeLayer = function(event, ui, layer) {
        if (ui.position.left != (layer.startFrame * $scope.xScale | 0)) {
          socket.sendEvent('set', {
            id: layer.position,
            field: 'startFrame',
            value: (ui.position.left / $scope.xScale | 0)
          });
        } else {
          socket.sendEvent('set', {
            id: layer.position,
            field: 'endFrame',
            value: ((ui.position.left + ui.size.width) / $scope.xScale | 0)
          });
        }
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
