'use strict';

angular.module('nin')
  .controller('MainCtrl', function ($scope, $http, ScriptReloader, socket, demo) {

    var keybindings = {
      '32': function() {
        // play/pause
        // 'space'
        demo.music.paused ? demo.music.play() : demo.music.pause();
      },
      '102': function() {
        // Fullscreen
        // 'F'
        $scope.fullscreen ? $scope.fullscreen = false : $scope.fullscreen = true;
      },
      '70': function() {
        // Fullscreen
        // 'f'
        $scope.fullscreen ? $scope.fullscreen = false : $scope.fullscreen = true;
      },
      '46': function() {
        //One second forward
        // '.'
        $scope.demo.jumpToFrame(demo.getCurrentFrame() + 60);
      },
      '44': function() {
        //One second back
        // ','
        $scope.demo.jumpToFrame(demo.getCurrentFrame() - 60);
      },
      '13': function() {
        // go back to start of demo
        // 'return'
        $scope.demo.jumpToFrame(0);
      },
      '62': function() {
        // skip one frame
        // '>'
        $scope.demo.jumpToFrame(demo.getCurrentFrame() + 1);
      },
      '60': function() {
        // rewind one frame
        // '<'
        $scope.demo.jumpToFrame(demo.getCurrentFrame() - 1);
      },
      '58': function() {
        // skip one frame
        // '>'
        $scope.demo.jumpToFrame(demo.getCurrentFrame() + 1);
      },
      '59': function() {
        // rewind one frame
        // '<'
        $scope.demo.jumpToFrame(demo.getCurrentFrame() - 1);
      }
    };

    document.addEventListener('keypress', function(event) {
      try {
        keybindings[event.which]();
      } catch (TypeError) { }
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
