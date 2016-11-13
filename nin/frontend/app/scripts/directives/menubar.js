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
          name: 'Rewind to start',
          click: () => commands.jumpToFrame(0)
        },
        {
          name: 'Rewind one second',
          shortcut: '.',
          click: () => commands.jog(-60)
        },
        {
          name: 'Forward one second',
          shortcut: ',',
          click: () => commands.jog(60)
        },
        {
          name: 'Rewind 10 seconds',
          shortcut: 'K',
          click: () => commands.jog(-60 * 10)
        },
        {
          name: 'Forward 10 seconds',
          shortcut: 'L',
          click: () => commands.jog(60 * 10)
        },
        {
          name: 'Rewind one frame',
          shortcut: ';',
          click: () => commands.jog(-1)
        },
        {
          name: 'Forward one frame',
          shortcut: ':',
          click: () => commands.jog(1)
        },
        {
          name: '-'
        },
        {
          name: '0.25x playback rate',
          shortcut: '1',
          click: () => commands.setPlaybackRate(0.25)
        },
        {
          name: '0.5x playback rate',
          shortcut: '2',
          click: () => commands.setPlaybackRate(0.5)
        },
        {
          name: '1x playback rate',
          shortcut: '3',
          click: () => commands.setPlaybackRate(1)
        },
        {
          name: '2x playback rate',
          shortcut: '4',
          click: () => commands.setPlaybackRate(2)
        },
        {
          name: '4x playback rate',
          shortcut: '5',
          click: () => commands.setPlaybackRate(4)
        },
        {
          name: '-'
        },
        {
          name: 'Set cue point',
          shortcut: 'g',
          click: () => commands.setCuePoint()
        },
        {
          name: 'Halve loop length',
          shortcut: 't',
          click: () => commands.multiplyLoopLengthBy(0.5)
        },
        {
          name: 'Double loop length',
          shortcut: 'y',
          click: () => commands.multiplyLoopLengthBy(2.0)
        },
        {
          name: '-'
        },
        {
          name: 'Toggle fullscreen',
          shortcut: 'm',
          click: () => commands.toggleFullscreen()
        },
        {
          name: 'Mute',
          shortcut: 'j',
          click: () => commands.toggleMusic()
        },
        {
          name: 'Volume up',
          shortcut: '+',
          click: () => commands.volumeDelta(0.1)
        },
        {
          name: 'Volume down',
          shortcut: '-',
          click: () => commands.volumeDelta(-0.1)
        },
        {
          name: 'Play/pause',
          shortcut: 'space',
          charCode: '32',
          click: () => commands.playPause()
        }
      ]
    },
    {
      name: 'Render',
      items: [
        {
          name: 'Start rendering',
          click: () => commands.startRendering()
        },
        {
          name: 'Stop rendering',
          click: () => commands.stopRendering()
        }
      ]
    },
    {
      name: 'Camera',
      items: [
        {
          name: 'Toggle camera path visualization',
          click: () => commands.toggleCameraPathVisualizations()
        }
      ]
    },
    {
      name: 'Generate',
      items: [
        {
          name: 'Node',
          click: () =>  {
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
          click: () => commands.selectTheme('dark')
        },
        {
          name: 'Light',
          click: () => commands.selectTheme('light')
        }
      ]
    },
    {
      name: 'Help',
      items: [
        {
          name: 'Online wiki',
          click: () => $window.open('https://github.com/ninjadev/nin/wiki')
        }
      ]
    }
  ];

  const dispatch = {};
  menu.forEach(category => {
    category.items.forEach(item => {
      if (item.shortcut) {
        const charCode = item.charCode || item.shortcut.charCodeAt(0);
        dispatch[charCode] = item.click;
      }
    });
  });

  return {
    restrict: 'A',
    templateUrl: 'views/menubar.html',
    link: function($scope, element, attrs) {
      $scope.menu = menu;

      $window.document.addEventListener('keypress', event => {
        if (!event) {
          return;
        };

        if (dispatch[event.which]) {
          dispatch[event.which]();
          event.preventDefault && event.preventDefault();
        }
      });

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
