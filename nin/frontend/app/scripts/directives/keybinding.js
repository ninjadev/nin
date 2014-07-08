angular.module('nin').directive('keybinding', function(commands) {

  var keybindings = {
    '32': function(e) {
      // 'space'
      commands.playPause();
      e.preventDefault();
    },
    '46': function() {
      // '.'
      commands.jog(60);
    },
    '44': function() {
      // ','
      commands.jog(-60);
    },
    '109': function() {
      // 'M'
      commands.toggleFullscreen();
    },
    '13': function(e) {
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
    },
    '112': function(e) {
      // 'p'
      commands.getCameraPosition();
      e.preventDefault();
    },
    '108': function(e) {
      // 'l'
      commands.getCameraLookat();
      e.preventDefault();
    },
    '122': function(e) {
      // 'z'
      commands.resetFlyFlightDynamics();
    },
    '99': function(e) {
      // 'c'
      commands.toggleFlyAroundMode();
    }
  };

  return {
    type: 'A',
    link: function() {
      document.addEventListener('keypress', function(event) {
        keybindings[event.which] && keybindings[event.which](event);
      });
    }
  };
});
