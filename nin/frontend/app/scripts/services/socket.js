(function() {
  'use strict';

  angular.module('nin').factory('socket', function() {
    var socket = new SockJS('//localhost:1337/socket');

    var handlers = {};
    socket.on = function(event, handler) {
      console.log('adding handler to', event);
      if(event.indexOf(' ') != -1) {
        var events = event.split(' ');
        for(var i = 0; i < events.length; i++) {
          socket.on(events[i], handler);
        }
        return;
      }
      if(!(event in handlers)) {
        handlers[event] = [];
      }
      handlers[event].push(handler);
    };

    socket.off = function(event, handler) {
      for(var i = 0; i < handlers[event].length; i++) {
        if(handler == handlers[event][i]) {
          handlers[event].pop(i);
          return;
        }
      }
    };

    socket.onmessage = function(message) {
      var event = JSON.parse(message.data);
      for(var i = 0; i < handlers[event.type].length; i++) {
        handlers[event.type][i](event.data);
      }
    };

    socket.sendEvent = function(event, data) {
      socket.send(JSON.stringify({
        type: event,
        data: data
      }));
    }

    return socket;
  });
})();
