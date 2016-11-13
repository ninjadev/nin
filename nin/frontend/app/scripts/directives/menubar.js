const keymage = require('keymage');

function menubar($window, commands) {
  const menu = [
    {
      name: 'File',
      items: [
        {
          name: 'Exit'
        }
      ]
    },
    {
      name: 'Playback',
      items: [
        {
          name: 'Jump to start',
          action: 'jumpToStart',
          defaultKeybind: 'shift-h',
          invoke: () => commands.jumpToFrame(0)
        },
        {
          name: 'Rewind to start',
          action: 'rewindToStart',
          defaultKeybind: 'shift-h',
          invoke: () => commands.jumpToFrame(0)
        },
        {
          name: 'Rewind one second',
          defaultKeybind: 'k',
          invoke: () => commands.jog(-60)
        },
        {
          name: 'Forward one second',
          defaultKeybind: 'j',
          invoke: () => commands.jog(60)
        },
        {
          name: 'Rewind 10 seconds',
          defaultKeybind: 'h',
          invoke: () => commands.jog(-60 * 10)
        },
        {
          name: 'Forward 10 seconds',
          defaultKeybind: 'l',
          invoke: () => commands.jog(60 * 10)
        },
        {
          name: 'Rewind one frame',
          defaultKeybind: 'shift-k',
          invoke: () => commands.jog(-1)
        },
        {
          name: 'Forward one frame',
          defaultKeybind: 'shift-j',
          invoke: () => commands.jog(1)
        },
        {
          name: '-'
        },
        {
          name: '0.25x playback rate',
          defaultKeybind: '6',
          invoke: () => commands.setPlaybackRate(0.25)
        },
        {
          name: '0.5x playback rate',
          defaultKeybind: '7',
          invoke: () => commands.setPlaybackRate(0.5)
        },
        {
          name: '2x playback rate',
          defaultKeybind: '8',
          invoke: () => commands.setPlaybackRate(2)
        },
        {
          name: '4x playback rate',
          defaultKeybind: '9',
          invoke: () => commands.setPlaybackRate(4)
        },
        {
          name: '1x playback rate',
          defaultKeybind: '0',
          invoke: () => commands.setPlaybackRate(1)
        },
        {
          name: '-'
        },
        {
          name: 'Set cue point',
          defaultKeybind: 'g',
          invoke: () => commands.setCuePoint()
        },
        {
          name: 'Halve loop length',
          defaultKeybind: 't',
          invoke: () => commands.multiplyLoopLengthBy(0.5)
        },
        {
          name: 'Double loop length',
          defaultKeybind: 'y',
          invoke: () => commands.multiplyLoopLengthBy(2.0)
        },
        {
          name: '-'
        },
        {
          name: 'Toggle fullscreen',
          defaultKeybind: 'f',
          invoke: () => commands.toggleFullscreen()
        },
        {
          name: 'Mute',
          defaultKeybind: 'm',
          invoke: () => commands.toggleMusic()
        },
        {
          name: 'Play/pause',
          defaultKeybind: 'space',
          charCode: '32',
          invoke: () => commands.playPause()
        }
      ]
    },
    {
      name: 'Render',
      items: [
        {
          name: 'Start rendering',
          invoke: () => commands.startRendering()
        },
        {
          name: 'Stop rendering',
          invoke: () => commands.stopRendering()
        }
      ]
    },
    {
      name: 'Generate',
      items: [
        {
          name: 'Node',
          invoke: () =>  {
            commands.pause();
            const nodeName = $window.prompt("Enter a name for the node:");
            commands.generate('node', nodeName);
          }
        }
      ]
    },
    {
      name: 'Theme',
      items: [
        {
          name: 'Dark',
          invoke: () => commands.selectTheme('dark')
        },
        {
          name: 'Light',
          invoke: () => commands.selectTheme('light')
        }
      ]
    },
    {
      name: 'Help',
      items: [
        {
          name: 'Online wiki',
          invoke: () => $window.open('https://github.com/ninjadev/nin/wiki')
        }
      ]
    }
  ];

  return {
    restrict: 'A',
    templateUrl: 'views/menubar.html',
    link: function($scope, element, attrs) {
      menu.forEach(category => {
        category.items.forEach(item => {
          if (item.defaultKeybind) {
            keymage(item.defaultKeybind, item.invoke);
          }
        });
      });

      $scope.menu = menu;

      var oldTopMenuOpen = false;
      $scope.menuState = {open: false, focus: ''};
      $window.document.querySelector('body').addEventListener('click', function() {
        $scope.$apply(function() {
          if(oldTopMenuOpen) {
            $scope.menuState.open = false;
            oldTopMenuOpen = false;
          } else {
            oldTopMenuOpen = true;
          }
        });
      });

    }
  };
}

module.exports = menubar;
