(function() {
  'use strict';

  angular.module('nin')
    .controller('BottomCtrl', function ($scope, $interval, socket, camera, commands) {

      var linesContainer = null;

      $scope.xScale = 0.5;
      $scope.xScaleTarget = 0.5;
      $scope.yScale = 1;

      $scope.$watch('xScaleTarget', function() {
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
      });

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

      $scope.$watch('currentFrame', function (nextFrame) {
        if ($scope.loopActive && nextFrame >= $scope.loopEnd) {
          $scope.demo.jumpToFrame($scope.loopStart);
        }
      });

      $interval(function(){
        $scope.hideMarker = false;
        if(!linesContainer) {
          return;
        }
        if(linesContainer.scrollLeft > $scope.currentFrame * $scope.xScale ||
          $scope.currentFrame * $scope.xScale >= linesContainer.scrollLeft + $(linesContainer).width()) {
          $scope.hideMarker = true;
        }
      }, 1000 / 60);
    });
})();
