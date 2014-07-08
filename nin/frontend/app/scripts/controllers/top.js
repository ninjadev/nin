angular.module('nin').controller('TopCtrl', function($scope, camera, commands) {
  $scope.displayValue = function(id, val) {
    var el = document.getElementById(id);
    el.innerText = val;
    var range = document.createRange();
    range.selectNodeContents(el);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  };

  $scope.getCameraPosition = function() {
    return camera.getCameraPosition();
  };

  $scope.getCameraLookat = function() {
    return camera.getCameraLookat();
  };

  $scope.toggleFlyAroundMode = function() {
    return camera.toggleFlyAroundMode();
  };

  $scope.resetFlyFlightDynamics = function resetFlyFlightDynamics() {
    return camera.resetFlyFlightDynamics();
  };

  commands.on('toggleFlyAroundMode', function() {
    camera.toggleFlyAroundMode();
  });

  commands.on('getCameraPosition', function() {
    $scope.displayValue('camera-pos-field', $scope.getCameraPosition());
  });

  commands.on('getCameraLookat', function() {
    $scope.displayValue('camera-lookat-field', $scope.getCameraLookat());
  });

  commands.on('resetFlyFlightDynamics', function() {
    camera.resetFlyFlightDynamics();
  });
});
