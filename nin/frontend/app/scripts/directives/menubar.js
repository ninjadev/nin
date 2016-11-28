const keymage = require('keymage');

function menubar($window, commands, ninrc) {
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
          name: 'Rewind to start',
          action: 'rewindToStart',
          defaultKeybind: 'shift-h',
          invoke: () => commands.jumpToFrame(0)
        },
        {
          name: 'Rewind one second',
          action: 'rewindOneSecond',
          defaultKeybind: 'k',
          invoke: () => commands.jog(-60)
        },
        {
          name: 'Forward one second',
          action: 'forwardOneSecond',
          defaultKeybind: 'j',
          invoke: () => commands.jog(60)
        },
        {
          name: 'Rewind 10 seconds',
          action: 'rewindTenSeconds',
          defaultKeybind: 'h',
          invoke: () => commands.jog(-60 * 10)
        },
        {
          name: 'Forward 10 seconds',
          action: 'forwardTenSeconds',
          defaultKeybind: 'l',
          invoke: () => commands.jog(60 * 10)
        },
        {
          name: 'Rewind one frame',
          action: 'rewindOneFrame',
          defaultKeybind: 'shift-k',
          invoke: () => commands.jog(-1)
        },
        {
          name: 'Forward one frame',
          action: 'forwardOneFrame',
          defaultKeybind: 'shift-j',
          invoke: () => commands.jog(1)
        },
        {
          name: '-'
        },
        {
          name: '0.25x playback rate',
          action: 'quarterPlaybackRate',
          defaultKeybind: '6',
          invoke: () => commands.setPlaybackRate(0.25)
        },
        {
          name: '0.5x playback rate',
          action: 'halfPlaybackRate',
          defaultKeybind: '7',
          invoke: () => commands.setPlaybackRate(0.5)
        },
        {
          name: '2x playback rate',
          action: 'doublePlaybackRate',
          defaultKeybind: '8',
          invoke: () => commands.setPlaybackRate(2)
        },
        {
          name: '4x playback rate',
          action: 'quadruplePlaybackRate',
          defaultKeybind: '9',
          invoke: () => commands.setPlaybackRate(4)
        },
        {
          name: '1x playback rate',
          action: 'resetPlaybackRate',
          defaultKeybind: '0',
          invoke: () => commands.setPlaybackRate(1)
        },
        {
          name: '-'
        },
        {
          name: 'Set cue point',
          defaultKeybind: 'g',
          action: 'setCuePoint',
          invoke: () => commands.setCuePoint()
        },
        {
          name: 'Halve loop length',
          action: 'halveLoopLength',
          defaultKeybind: 't',
          invoke: () => commands.multiplyLoopLengthBy(0.5)
        },
        {
          name: 'Double loop length',
          action: 'doubleLoopLength',
          defaultKeybind: 'y',
          invoke: () => commands.multiplyLoopLengthBy(2.0)
        },
        {
          name: '-'
        },
        {
          name: 'Toggle fullscreen',
          action: 'toggleFullscreen',
          defaultKeybind: 'f',
          invoke: () => commands.toggleFullscreen()
        },
        {
          name: 'Mute',
          action: 'toggleMute',
          defaultKeybind: 'm',
          invoke: () => commands.toggleMusic()
        },
        {
          name: 'Play/pause',
          action: 'togglePlayPause',
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
          action: 'startRendering',
          invoke: () => commands.startRendering()
        },
        {
          name: 'Stop rendering',
          action: 'stopRendering',
          invoke: () => commands.stopRendering()
        }
      ]
    },
    {
      name: 'Generate',
      items: [
        {
          name: 'Node',
          action: 'generateNode',
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
          action: 'activateDarkTheme',
          invoke: () => commands.selectTheme('dark')
        },
        {
          name: 'Light',
          action: 'activateLightTheme',
          invoke: () => commands.selectTheme('light')
        }
      ]
    },
    {
      name: 'Help',
      items: [
        {
          name: 'Online wiki',
          action: 'help',
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
          item.keybind =
            ninrc.keybinds && ninrc.keybinds[item.action]
            || item.defaultKeybind;
          if (item.keybind) {
            keymage(item.keybind, item.invoke);
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
