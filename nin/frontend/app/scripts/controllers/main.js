'use strict';

angular.module('nin')
  .controller('MainCtrl', function ($scope, $http, ScriptReloader, socket, demo) {

    var keybindings = {
      '32': function() {
        demo.music.paused ? demo.music.play() : demo.music.pause();
      },
      '102': function() {
        $scope.fullscreen ? $scope.fullscreen = false : $scope.fullscreen = true;
      },
      '70': function() {
        $scope.fullscreen ? $scope.fullscreen = false : $scope.fullscreen = true;
      }
    };

    document.addEventListener('keypress', function(event) {
      keybindings[event.which]();
    });

    $scope.demo = demo;
    $scope.fullscreen = false;
    $scope.inspectedLayer = null;

    socket.onopen = function() {
      console.log('nin socket connection established', arguments);
    };

    $http({
      method: 'GET',
      url: '//localhost:9999/res/layers.json'
    }).success(function(layers) {
      $scope.layers = layers;
      for(var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        demo.lm.loadLayer(layer);
      }
    });

    socket.onmessage = function(event) {
      var eventType = event.data.split(' ')[0];
      if(eventType == 'add' || eventType == 'change') {
        var path = event.data.split(' ')[1];
        /* 'test-project' hack, to be removed later */
        path = path.slice(12);
        ScriptReloader.reload('//localhost:9999/' + path, function() {
          var splitted = path.split('/');
          var layerName = splitted[splitted.length - 1].split('.')[0];
          demo.lm.refresh(layerName);
        });
      }
    };

    socket.onclose = function(e) {
      console.log('nin socket connection closed', e);
    };
  });
