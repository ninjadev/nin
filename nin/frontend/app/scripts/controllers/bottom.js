'use strict';

angular.module('nin')
  .controller('BottomCtrl', function ($scope, $interval, demo) {

    var linesContainer = null;

    $scope.onBottomScroll = function(event) {
      linesContainer = event.target;
      $scope.bottomScrollOffset = event.target.scrollLeft;
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
