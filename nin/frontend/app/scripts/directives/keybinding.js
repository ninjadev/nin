angular.module('nin').directive('keybinding', function(commands) {

  var keybindings = {
    '32': function() {
      // 'space'
      commands.playPause();
    },
    '102': function() {
      // 'F'
      commands.toggleFullscreen();
    },
    '70': function() {
      // 'f'
      commands.toggleFullscreen();
    },
    '46': function() {
      // '.'
      commands.jog(60);
    },
    '44': function() {
      // ','
      commands.jog(-60);
    },
    '13': function() {
      // 'return'
      commands.jumpToFrame(0);
    },
    '62': function() {
      // '>'
      commands.jog(1);
    },
    '60': function() {
      // '<'
      commands.jog(-1);
    },
    '58': function() {
      // '>'
      commands.jog(1);
    },
    '59': function() {
      // '<'
      commands.jog(-1);
    }
  };

  return {
    type: 'A',
    link: function() {
      document.addEventListener('keypress', function(event) {
        keybindings[event.which] && keybindings[event.which]();
      });
    }
  };
});
