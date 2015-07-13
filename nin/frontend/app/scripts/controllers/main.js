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

    function updateLayers() {
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
        Loader.start(function() {}, function() {});
        demo.lm.jumpToFrame(demo.getCurrentFrame());
      });
    }

    function updateCamerapaths() {
      $http.get('//localhost:9000/res/camerapaths.json')
        .success(function(camerapaths) {
          CameraController.paths = camerapaths;
          for (var index in CameraController.layers) {
            CameraController.layers[index].parseCameraPath(camerapaths);
          }
        });
    }

    function updateShaders(path) {
      var splitted = path.split('/');
      var shaderName = splitted[splitted.length - 2];
      ScriptReloader.reload('//localhost:9000/gen/shaders.js', function() {
        for (var i=0; i < $scope.layers.length; i++) {
          var layer = $scope.layers[i];
          if (layer.shaders && layer.shaders.indexOf(shaderName) !== -1) {
            demo.lm.refresh(layer.type);
            demo.lm.update(demo.looper.currentFrame);
          }
        }
        Loader.start(function() {}, function() {});
      });
    }

    function updateSingleLayer(path) {
      var splitted = path.split('/');
      ScriptReloader.reload('//localhost:9000/' + path, function() {
        var className = splitted[splitted.length - 1].split('.')[0];
        demo.lm.refresh(className);
        demo.lm.update(demo.looper.currentFrame);
        Loader.start(function() {}, function() {});
      });
    }

    socket.on('add', function(e) {
      e.path = e.path.replace(/\\/g, '/');
      console.log('add!', e);
      if(e.path == '/res/layers.json') {
        updateLayers();
      } else if (e.path == '/res/camerapaths.json') {
        updateCamerapaths();
      } else if (e.path.indexOf('/shaders/') !== -1) {
        updateShaders(e.path);
      } else {
        updateSingleLayer(e.path);
      }
    });

    socket.on('change', function(e) {
      e.path = e.path.replace(/\\/g, '/');
      console.log('change!', e);
      if(e.path == '/res/layers.json') {
        updateLayers();
      } else if (e.path == '/res/camerapaths.json') {
        updateCamerapaths();
      } else if (e.path.indexOf('/shaders/') !== -1) {
        updateShaders(e.path);
      } else {
        updateSingleLayer(e.path);
      }
    });

    socket.onclose = function(e) {
      console.log('nin socket connection closed', e);
    };
  });
