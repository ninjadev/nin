'use strict';

angular.module('nin')
  .controller('MainCtrl', function ($scope, $http, ScriptReloader, socket, demo, commands) {

    $scope.demo = demo;
    $scope.fullscreen = false;
    $scope.inspectedLayer = null;

    commands.on('toggleFullscreen', function() {
      $scope.fullscreen = !$scope.fullscreen;
    });

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

    socket.on('add change', function(e) {
      e.path = e.path.slice(12);
      ScriptReloader.reload('//localhost:9999/' + e.path, function() {
        var splitted = e.path.split('/');
        var layerName = splitted[splitted.length - 1].split('.')[0];
        demo.lm.refresh(layerName);
      });
    });

    socket.onclose = function(e) {
      console.log('nin socket connection closed', e);
    };
  });
