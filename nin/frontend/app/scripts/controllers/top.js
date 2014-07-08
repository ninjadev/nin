angular.module('nin').controller('TopCtrl', function($scope, camera, commands) {
  $scope.displayValue = function(id, val) {
    var el = document.getElementById(id);
    el.value = val;
    el.select();
  };

  $scope.getCameraPosition = function() {
    return camera.getCameraPosition();
  };
  commands.on('getCameraPosition', function() {
    $scope.displayValue('camera-pos-field', $scope.getCameraPosition());
  });

  $scope.getCameraLookat = function() {
    return camera.getCameraLookat();
  };
  commands.on('getCameraLookat', function() {
    $scope.displayValue('camera-lookat-field', $scope.getCameraLookat());
  });

  $scope.toggleFlyAroundMode = function() {
    return camera.toggleFlyAroundMode();
  };
});
