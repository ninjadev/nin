'use strict';

angular.module('nin')
  .factory('ScriptReloader', function () {
    return {
      reload: function(path, callback) {
        var script = document.createElement('script');
        document.body.appendChild(script);
        script.onload = function() {
          callback && callback();
        };
        script.src = path;
      }
    };
  });
