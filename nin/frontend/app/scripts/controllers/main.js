'use strict';

angular.module('nin')
  .controller('MainCtrl', function ($scope, $http, ScriptReloader, socket, demo, commands) {

    $scope.demo = demo;
    $scope.fullscreen = false;
    $scope.inspectedLayer = null;
    $scope.mute = localStorage.getItem('nin-mute') ? true : false;
    if (localStorage.hasOwnProperty('nin-volume')) {
      $scope.volume = +localStorage.getItem('nin-volume');
    } else {
      $scope.volume = 1;
    }

    commands.on('toggleFullscreen', function() {
      $scope.fullscreen = !$scope.fullscreen;
    });

    commands.on('toggleMusic', function() {
      $scope.mute = !$scope.mute;
      if ($scope.mute) {
        localStorage.setItem("nin-mute", 1);
      } else {
        localStorage.removeItem("nin-mute");
      }
    });

    commands.on('volumeDelta', function(delta) {
      $scope.mute = false;
      $scope.volume = clamp(0, $scope.volume + delta, 1);
      localStorage.setItem('nin-volume', $scope.volume);
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
          url: '//localhost:9000/res/layers.json'
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
        $http.get('//localhost:9000/res/camerapaths.json')
          .success(function(camerapaths) {
            CameraController.paths = camerapaths;
            for (var index in CameraController.layers) {
              CameraController.layers[index].parseCameraPath(camerapaths);
            };
          });
      } else {
        ScriptReloader.reload('//localhost:9000/' + e.path, function() {
          var splitted = e.path.split('/');
          var className = splitted[splitted.length - 1].split('.')[0];
          demo.lm.refresh(className);
        });
      }
    });

    socket.onclose = function(e) {
      console.log('nin socket connection closed', e);
    };
  });
