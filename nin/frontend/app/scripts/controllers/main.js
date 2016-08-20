(function() {
  'use strict';

  angular.module('nin')
    .controller('MainCtrl', function ($scope, $rootScope, $http, $window, ScriptReloader, socket, demo, commands) {

      $scope.themes = [
        'dark',
        'light'
      ];

      $scope.fileCache = {};

      $scope.selectedTheme = localStorage.getItem('selectedTheme') || 'dark';
      commands.on('selectTheme', function(theme) {
        var foundTheme = false;
        for(var i = 0; i < $scope.themes.length; i++) {
          if($scope.themes[i] == theme) {
            foundTheme = true;
            continue;
          }
        }
        if(!foundTheme) {
          return;
        }
        $scope.selectedTheme = theme;
        localStorage.setItem('selectedTheme', theme);
      });

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
            {name: 'Rewind 10 seconds', shortcut: 'K', click: function() {
              commands.jog(-60 * 10);
            }},
            {name: 'Forward 10 seconds', shortcut: 'L', click: function() {
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
            {name: 'Halve loop length', shortcut: 't', click: function() {
              commands.multiplyLoopLengthBy(0.5);
            }},
            {name: 'Double loop length', shortcut: 'y', click: function() {
              commands.multiplyLoopLengthBy(2.0);
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
            {name: 'Start rendering', click: function() {
              commands.startRendering();
            }},
            {name: 'Stop rendering', click: function() {
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
            {name: 'Node', click: function() {
              commands.pause();
              var layerName = window.prompt("Enter a name for the node:");
              commands.generate('node', layerName);
            }}
          ]
        },
        {
          name: 'Theme',
          items: [
            {name: 'Dark', click: function() {
              commands.selectTheme('dark');
            }},
            {name: 'Light', click: function() {
              commands.selectTheme('light');
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

      /* http://stackoverflow.com/a/7616484 */
      function hash(string) {
        var h = 0, i, chr, len;
        if (string.length === 0) return h;
        for (i = 0, len = string.length; i < len; i++) {
          chr   = string.charCodeAt(i);
          h = ((h << 5) - h) + chr;
          h |= 0; // Convert to 32bit integer
        }
        return h;
      }

      var layerShaderDependencies = {};
      $rootScope.globalJSErrors = $rootScope.globalJSErrors || {};
      socket.on('add change', function(event) {
        try {
          switch (event.type) {
            case 'graph':
              var graph = JSON.parse(event.content);

              $scope.graph = graph;
              demo.nm.hardReset();

              for(var i in graph) {
                var nodeInfo = graph[i];
                var node = demo.nm.createNode(nodeInfo);
                demo.nm.insertOrReplaceNode(node);
              }
              for(var i in graph) {
                var nodeInfo = graph[i];
                for(var outputName in nodeInfo.connectedTo) {
                  var toNodeId = nodeInfo.connectedTo[outputName].split('.')[0];
                  var inputName = nodeInfo.connectedTo[outputName].split('.')[1];
                  demo.nm.connect(
                      nodeInfo.id,
                      outputName,
                      toNodeId,
                      inputName);
                }
              }

              Loader.start(function() {}, function() {});
              break;

            case 'camerapaths':
              var camerapaths = JSON.parse(event.content);

              CameraController.paths = camerapaths;
              for (var index in CameraController.layers) {
                var cameraController = CameraController.layers[index];
                cameraController.parseCameraPath(camerapaths);
                demo.nm.refresh(cameraController.layer_id);
              }

              demo.nm.update(demo.looper.currentFrame);
              break;

            case 'shader':
              var indirectEval = eval;
              $scope.fileCache[event.path] = event.content;
              indirectEval(event.content);

              for (var i in $scope.layers) {
                var layer = $scope.layers[i];
                if (layerShaderDependencies[layer.type]) {
                  if (layerShaderDependencies[layer.type].indexOf(event.shadername) !== -1) {
                    demo.nm.refresh(layer.type);
                  }
                }
              }

              demo.nm.update(demo.looper.currentFrame);
              Loader.start(function() {}, function() {});
              break;

            case 'node':
              $scope.fileCache[event.path] = event.content;
              var indirectEval = eval;
              indirectEval(event.content);

              var splitted = event.path.split('/');
              var filename = splitted[splitted.length - 1];
              var typename = filename.slice(0, -3);
              if($scope.graph) {
                for(var i = 0; i < $scope.graph.length; i++) {
                  var nodeInfo = $scope.graph[i];
                  if(nodeInfo.type == typename) {
                    var node = demo.nm.createNode(nodeInfo);
                    demo.nm.insertOrReplaceNode(node);
                  }
                }
              }

              demo.nm.update(demo.looper.currentFrame);

              Loader.start(function() {}, function() {});
              break;
          }

          delete $rootScope.globalJSErrors[event.type];
        } catch (e) {
          e.context = "WS load of " + event.path + " failed";
          e.type = event.type;
          e.path = event.path;
          $rootScope.globalJSErrors[event.type] = e;
        }
      });

      socket.onclose = function(e) {
        console.log('nin socket connection closed', e);
        $scope.disconnected = true;
      };
    });
})();
