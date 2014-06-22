angular.module('nin').service('commands', function() {

  var handlers = {};

  function execute(command, arguments) {
    for(var i = 0; i < handlers[command].length; i++) {
      handlers[command][i].apply(window, arguments);
    }
  }

  var commands = {
    on: function(command, handler) {
      if(!(command in handler)) {
        handlers[command] = [];
        if(command in commands) {
          throw 'command name not allowed.';
        }
        commands[command] = function() {
          execute(command, arguments);
        }
      }
      handlers[command].push(handler);
    }
  }

  return commands;
});
