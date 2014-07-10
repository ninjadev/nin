'use strict';

angular.module('nin')
  .controller('MainCtrl', function ($scope, $http, ScriptReloader, socket, demo, commands) {

    $scope.demo = demo;
    $scope.fullscreen = false;
    $scope.inspectedLayer = null;
    $scope.mute = false;

    commands.on('toggleFullscreen', function() {
      $scope.fullscreen = !$scope.fullscreen;
    });

    commands.on('toggleMusic', function() {
      $scope.mute = !$scope.mute;
    });

    socket.onopen = function() {
      console.log('nin socket connection established', arguments);
    };

    socket.on('add change', function(e) {
      if (e.path.indexOf("test-project") !== -1) {
        e.path = e.path.slice(12);
      }
      e.path = e.path.replace(/\\/g, '/');
      if(e.path == '/res/layers.json') {
        $http({
          method: 'GET',
          url: '//localhost:9999/res/layers.json'
        }).success(function(layers) {
          $scope.layers = layers;
          demo.lm.hardReset();
          for(var i = 0; i < layers.length; i++) {
            var layer = layers[i];
            layer.position = i;
            demo.lm.loadLayer(layer);
          }
          demo.lm.jumpToFrame(demo.getCurrentFrame());
        });
      } else if (e.path == '/res/camerapaths.json') {
        $http.get('//localhost:9999/res/camerapaths.json')
          .success(function(camerapaths) {
            CameraController.paths = camerapaths;
            for (var index in CameraController.layers) {
              CameraController.layers[index].parseCameraPath(camerapaths);
            };
          });
      } else {
        ScriptReloader.reload('//localhost:9999/' + e.path, function() {
          var splitted = e.path.split('/');
          var layerName = splitted[splitted.length - 1].split('.')[0];
          demo.lm.refresh(layerName);
        });
      }
    });

    socket.onclose = function(e) {
      console.log('nin socket connection closed', e);
    };
  });
