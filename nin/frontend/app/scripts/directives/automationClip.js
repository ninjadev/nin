(function() {
  'use strict';

  angular.module('nin').directive('automationClip', AutomationClip);

  function AutomationClip() {

    function AutomationClipCtrl($scope, $timeout) {
      $scope.path = '';
      $scope.$watch('layer.startFrame', updatePath);
      $scope.$watch('layer.endFrame', updatePath);
      $scope.$watch('automationClip', updatePath, true);
      $scope.$watch('layerXScale', updatePath);
      $scope.$watch('layerYScale', updatePath);

      var needsUpdate = false;
      function updatePath() {
        if(!needsUpdate) {
          needsUpdate = true;
          $timeout(function() {
            needsUpdate = false;
            var firstKeyframe = $scope.automationClip[0];
            var path = 'M' + (firstKeyframe.relativeFrame * $scope.layerXScale) + ' ' + 
                     ((1 - firstKeyframe.value) * 30 * $scope.layerYScale);
            for(var i = 1; i < $scope.automationClip.length; i++) {
              var keyframe = $scope.automationClip[i];
              if(keyframe.type == 'smoothstep') {
                var leftX = $scope.automationClip[i - 1].relativeFrame * $scope.layerXScale;
                var rightX = keyframe.relativeFrame * $scope.layerXScale;
                var length = rightX - leftX;
                var resolution = 20;
                for(var j = 1; j <= resolution; j++) {
                  path += ' L' + (leftX + length * j / resolution) + ' ' +
                    ((1 - smoothstep($scope.automationClip[i - 1].value,
                                     keyframe.value,
                                     j / resolution)) * 30 * $scope.layerYScale);
                }
              } else {
                path += (' L' +
                         (keyframe.relativeFrame * $scope.layerXScale) + ' ' + 
                         ((1 - keyframe.value) * 30 * $scope.layerYScale));
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
