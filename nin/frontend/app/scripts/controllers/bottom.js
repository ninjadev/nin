'use strict';

angular.module('nin')
  .controller('BottomCtrl', function ($scope, $interval, socket) {

    var linesContainer = null;

    $scope.onBottomScroll = function(event) {
      linesContainer = event.target;
      $scope.bottomScrollOffset = event.target.scrollLeft;
    };

    $scope.musicLayerClick = function($event) {
      $scope.demo.jumpToFrame($event.offsetX);
    };

    $scope.layerLabelClick = function(layer) {
      $scope.$parent.$parent.inspectedLayer = $scope.inspectedLayer == layer
                                            ? null
                                            : layer;
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
