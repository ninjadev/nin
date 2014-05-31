'use strict';

angular.module('nin')
  .controller('MainCtrl', function ($scope, $http, ScriptReloader, socket, demo) {

    var keybindings = {
      '32': function() {
        demo.music.paused ? demo.music.play() : demo.music.pause();
      }
    };

    document.addEventListener('keypress', function(event) {
      keybindings[event.which]();
    });

    $scope.demo = demo;

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
      console.log('message!', event.data);
      var eventType = event.data.split(' ')[0];
      if(eventType == 'add') {
        var path = event.data.split(' ')[1];
        /* 'test-project' hack, to be removed later */
        path = path.slice(12);
        ScriptReloader.reload('//localhost:9999/' + path);
      }
    };

    socket.onclose = function(e) {
      console.log('nin socket connection closed', e);
    };
  });
