'use strict';

angular.module('nin')
  .controller('BottomCtrl', function ($scope, $interval, socket, camera, commands) {

    var linesContainer = null;

    $scope.onBottomScroll = function(event) {
      linesContainer = event.target;
      $scope.bottomScrollOffset = event.target.scrollLeft;
    };

    $scope.musicLayerClick = function($event) {
      var target = $event.target || $event.srcElement,
        rect = target.getBoundingClientRect(),
        offsetX = ($event.clientX - rect.left) | 0;

      $scope.demo.jumpToFrame(offsetX);
    };

    $scope.layerLabelClick = function(layer) {
      $scope.$parent.$parent.inspectedLayer = $scope.inspectedLayer == layer
                                            ? null
                                            : layer;
      camera.startEdit(layer);
    };

    $scope.dragResizeLayer = function(event, ui, layer) {
      if (ui.position.left != layer.startFrame) {
        socket.sendEvent('set', {
          id: layer.position,
          field: 'startFrame',
          value: ui.position.left
        });
      } else {
        socket.sendEvent('set', {
          id: layer.position,
          field: 'endFrame',
          value: ui.position.left + ui.size.width
        });
      }
    };

    commands.on('setCuePoint', function() {
      if ($scope.loopStart == null) {
        $scope.loopStart = $scope.currentFrame;
      } else if ($scope.loopEnd == null) {
        if ($scope.loopStart > $scope.currentFrame) {
          $scope.loopEnd = $scope.loopStart;
          $scope.loopStart = $scope.currentFrame;
        } else {
          $scope.loopEnd = $scope.currentFrame;
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
      if(linesContainer.scrollLeft > $scope.currentFrame ||
        $scope.currentFrame >= linesContainer.scrollLeft + $(linesContainer).width()) {
        $scope.hideMarker = true;
      } else {
        $scope.hideMarker = false;
      }
    }, 1000 / 60);
  });
