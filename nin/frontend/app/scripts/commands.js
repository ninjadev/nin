const handlers = {};

function execute(command, args) {
  for(var i = 0; i < handlers[command].length; i++) {
    handlers[command][i].apply(window, args);
  }
}

const commands = {
  on(command, handler) {
    if (!(command in handlers)) {
      handlers[command] = [];
      if (command in commands) {
        throw 'command name not allowed.';
      }
      commands[command] = function() {
        execute(command, arguments);
      };
    }
    handlers[command].push(handler);
  }
};

module.exports = commands;
