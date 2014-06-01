'use strict';

angular.module('nin').factory('socket', function() {
  var socket = new SockJS('//localhost:1337/socket');
  return socket;
});
