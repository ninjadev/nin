'use strict';

angular.module('nin')
  .controller('BottomCtrl', function ($scope, $interval) {

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
