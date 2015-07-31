(function() {
  'use strict';

  angular.module('nin')
    .controller('MainCtrl', function ($scope, $http, $window, ScriptReloader, socket, demo, commands) {

      $scope.menu = [
        {
          name: 'File',
          items: [
            {name: 'Exit', shortcut: 'ESC', click: function() {}}
          ]
        },
        {
          name: 'Playback',
          items: [
            {name: 'Rewind to start', shortcut: 'return', click: function() {
              commands.jumpToFrame(0);
            }},
            {name: 'Rewind one second', shortcut: '.', click: function() {
              commands.jog(-60);
            }},
            {name: 'Forward one second', shortcut: ',', click: function() {
              commands.jog(60);
            }},
            {name: 'Rewind 10 seconds', shortcut: 'L', click: function() {
              commands.jog(-60 * 10);
            }},
            {name: 'Foward 10 seconds', shortcut: 'K', click: function() {
              commands.jog(60 * 10);
            }},
            {name: 'Rewind one frame', shortcut: ';', click: function() {
              commands.jog(-1);
            }},
            {name: 'Forward one frame', shortcut: ':', click: function() {
              commands.jog(1);
            }},
            {name: '-'},
            {name: '0.25x playback rate', shortcut: '1', click: function() {
              commands.setPlaybackRate(0.25);
            }},
            {name: '0.5x playback rate', shortcut: '2', click: function() {
              commands.setPlaybackRate(0.5);
            }},
            {name: '1x playback rate', shortcut: '3', click: function() {
              commands.setPlaybackRate(1);
            }},
            {name: '2x playback rate', shortcut: '4', click: function() {
              commands.setPlaybackRate(2);
            }},
            {name: '4x playback rate', shortcut: '5', click: function() {
              commands.setPlaybackRate(4);
            }},
            {name: '-'},
            {name: 'Set cue point', shortcut: 'g', click: function() {
              commands.setCuePoint();
            }},
            {name: '-'},
            {name: 'Toggle fullscreen', shortcut: 'm', click: function() {
              commands.toggleFullscreen();
            }},
            {name: 'Mute', shortcut: 'j', click: function() {
              commands.toggleMusic();
            }},
            {name: 'Volume up', shortcut: '+', click: function() {
              commands.volumeDelta(0.1);
            }},
            {name: 'Volume down', shortcut: '-', click: function() {
              commands.volumeDelta(-0.1);
            }},
            {name: 'Play/pause', shortcut: 'space', click: function() {
              commands.playPause();
            }}
          ]
        },
        {
          name: 'Render',
          items: [
            {name: 'Start rendering', shortcut: 'Shift + R', click: function() {
              commands.startRendering();
            }},
            {name: 'Stop rendering', shortcut: 'Shift + R', click: function() {
              commands.stopRendering();
            }}
          ]
        },
        {
          name: 'Camera',
          items: [
            {name: 'Toggle camera path visualization', click: function() {
              commands.toggleCameraPathVisualizations();
            }}
          ]
        },
        {
          name: 'Generate',
          items: [
            {name: 'Layer', click: function() {
              commands.pause();
              var layerName = window.prompt("Enter a name for the layer:");
              commands.generate('layer', layerName);
            }},
            {name: 'Shader', click: function() {
              commands.pause();
              var shaderName = window.prompt("Enter a name for the shader:");
              commands.generate('shader', shaderName);
            }},
            {name: 'Shader with layer', click: function() {
              commands.pause();
              var shaderName = window.prompt("Enter a name for the shader:");
              commands.generate('shaderWithLayer', shaderName);
            }}
          ]
        },
        {
          name: 'Help',
          items: [
            {name: 'Online wiki', click: function() {
              window.open('https://github.com/ninjadev/nin/wiki');
            }}
          ]
        },
      ];

      $scope.demo = demo;
      $scope.fullscreen = false;
      $scope.inspectedLayer = null;
      $scope.mute = localStorage.getItem('nin-mute') ? true : false;
      if (localStorage.hasOwnProperty('nin-volume')) {
        $scope.volume = +localStorage.getItem('nin-volume');
      } else {
        $scope.volume = 1;
      }

      commands.on('generate', function(type, name) {
        socket.sendEvent('generate', {type: type, name: name});
      });

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
          url: '//localhost:9000/res/layers.json?' + Math.random() * 1e16
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
        if(e.path == 'res/layers.json') {
          updateLayers();
        } else if (e.path == 'res/camerapaths.json') {
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
        if(e.path == 'res/layers.json') {
          updateLayers();
        } else if (e.path == 'res/camerapaths.json') {
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
})();
