angular.module('nin').controller('TopCtrl', function($scope, camera, commands, $interval) {
  $scope.displayValue = function(id, val) {
    var el = document.getElementById(id);
    el.textContent = val;
    var range = document.createRange();
    range.selectNodeContents(el);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  };

  $scope.flyAroundMode = false;
  var flyAroundInterval = null;

  $scope.commands = commands;

  function updateScopeCameraValues() {
    $scope.cameraPosition = camera.getCameraPosition();
    $scope.cameraLookat = camera.getCameraLookat();
    $scope.cameraRoll = camera.getCameraRoll();
    $scope.cameraFov = camera.getCameraFov();
  }

  $scope.$watch('currentFrame', function() {
    updateScopeCameraValues();
  });

  $scope.toggleFlyAroundMode = function() {
    return camera.toggleFlyAroundMode();
  };

  $scope.resetFlyFlightDynamics = function resetFlyFlightDynamics() {
    return camera.resetFlyFlightDynamics();
  };

  commands.on('toggleFlyAroundMode', function() {
    $scope.flyAroundMode = !$scope.flyAroundMode;
    camera.toggleFlyAroundMode();
    if($scope.flyAroundMode) {
      flyAroundInterval = $interval(updateScopeCameraValues, 16);
    } else {
      stopFlyAroundInterval();
      flyAroundInterval.cancel();
      flyAroundInterval = null;
    }
  });

  $scope.$on('$destroy', function() {
    if(flyAroundInterval) {
      flyAroundInterval.cancel();
    }
  });

  commands.on('resetFlyFlightDynamics', function() {
    camera.resetFlyFlightDynamics();
  });
  commands.on('increaseCameraZoom', function() {
    camera.deltaFov(-0.5);
    $scope.displayValue('camera-fov-field', $scope.getCameraFov());
  });
  commands.on('decreaseCameraZoom', function() {
    camera.deltaFov(0.5);
    $scope.displayValue('camera-fov-field', $scope.getCameraFov());
  });
});
