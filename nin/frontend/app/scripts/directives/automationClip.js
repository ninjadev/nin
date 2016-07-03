(function() {
  'use strict';

  angular.module('nin').directive('automationClip', AutomationClip);

  function AutomationClip() {

    function AutomationClipCtrl($scope, $timeout, socket) {
      $scope.path = '';
      $scope.$watch('layer.startFrame', updateCoordinateStore);
      $scope.$watch('layer.endFrame', updateCoordinateStore);
      $scope.$watch('automationClip', updateCoordinateStore, true);
      $scope.$watch('layerXScale', updateCoordinateStore);
      $scope.$watch('layerYScale', updateCoordinateStore);

      $scope.coordinateStore = {};

      function updateCoordinateStore() {
        for(var i = 0; i < $scope.automationClip.length; i++) {
          var keyframe = $scope.automationClip[i];
          $scope.coordinateStore[i] = {
            x: keyframe.relativeFrame * $scope.layerXScale,
            y: (1 - keyframe.value) * 30 * $scope.layerYScale
          }
        }
        updatePath();
      }

      var currentX, currentY;
      var currentElement = null;
      $scope.selectedKeyframe = -1;
      $scope.mousedownKeyframe = function($event, i) {
        $scope.selectedKeyframe = i;
        currentX = $event.clientX;
        currentY = $event.clientY;
        currentElement = $event.target;
      }
      $scope.mouseupSvg = function($event, i) {
        var fieldPrefix = 'automationClips.' + $scope.clipName + '.' + $scope.selectedKeyframe;
        socket.sendEvent('set', {
          id: $scope.layer.position,
          field: fieldPrefix + '.relativeFrame',
          value: ($scope.coordinateStore[$scope.selectedKeyframe].x / $scope.layerXScale) | 0,
        });
        socket.sendEvent('set', {
          id: $scope.layer.position,
          field: fieldPrefix + '.value',
          value: (1 - $scope.coordinateStore[$scope.selectedKeyframe].y / $scope.layerYScale / 30),
        });
        $scope.selectedKeyframe = -1;
        currentElement = null;
      }
      $scope.mousemoveSvg = function($event) {
        if($scope.selectedKeyframe == -1) {
          return;
        }
        var dx = $event.clientX - currentX;
        var dy = $event.clientY - currentY;
        var x = $scope.coordinateStore[$scope.selectedKeyframe].x + dx;
        var y = $scope.coordinateStore[$scope.selectedKeyframe].y + dy;
        $scope.coordinateStore[$scope.selectedKeyframe].x = x;
        $scope.coordinateStore[$scope.selectedKeyframe].y = y;
        currentX = $event.clientX;
        currentY = $event.clientY;
        updatePath();
      }
      $scope.clickKeyframe = function($event, i) {
        $event.stopPropagation();
      }
      var cyclicTypeMap = {
        hold: 'lerp',
        lerp: 'smoothstep',
        smoothstep: 'hold'
      }
      $scope.rightclickKeyframe = function($event, i) {
        $event.stopPropagation();
        var fieldPrefix = 'automationClips.' + $scope.clipName + '.' + i;
        socket.sendEvent('set', {
          id: $scope.layer.position,
          field: fieldPrefix + '.type',
          value: cyclicTypeMap[$scope.automationClip[i].type]
        });
      }

      var needsUpdate = false;
      function updatePath() {
        if(!needsUpdate) {
          needsUpdate = true;
          $timeout(function() {
            needsUpdate = false;
            var firstKeyframe = $scope.automationClip[0];
            var path = 'M' + $scope.coordinateStore[0].x + ' ' + $scope.coordinateStore[0].y;
            for(var i = 1; i < $scope.automationClip.length; i++) {
              var keyframe = $scope.automationClip[i];
              if(keyframe.type == 'smoothstep') {
                var leftX = $scope.coordinateStore[i - 1].x;
                var rightX = $scope.coordinateStore[i].x;
                var length = rightX - leftX;
                var resolution = 20;
                for(var j = 1; j <= resolution; j++) {
                  path += ' L' + (leftX + length * j / resolution) + ' ' +
                    smoothstep($scope.coordinateStore[i - 1].y,
                               $scope.coordinateStore[i].y,
                               j / resolution);
                }
              } else if(keyframe.type == 'lerp') {
                path += ' L' + $scope.coordinateStore[i].x + ' ' + $scope.coordinateStore[i].y;
              } else if(keyframe.type == 'hold') {
                path += ' L' + $scope.coordinateStore[i].x + ' ' + $scope.coordinateStore[i - 1].y;
                path += ' L' + $scope.coordinateStore[i].x + ' ' + $scope.coordinateStore[i].y;
              }
            }
            $scope.path = path;

          });
        }
      }
    }

    return {
      scope: {
        automationClip: '=',
        layer: '=',
        layerXScale: '=',
        layerYScale: '=',
        clipName: '='
      },
      restrict: 'A',
      templateUrl: 'views/automation-clip.html',
      controller: AutomationClipCtrl
    };
  }
})();
