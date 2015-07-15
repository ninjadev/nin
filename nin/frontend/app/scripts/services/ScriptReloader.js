(function() {
  'use strict';

  angular.module('nin')
    .factory('ScriptReloader', function () {
      return {
        reload: function(path, callback) {
          $.getScript(path, callback);
        }
      };
    });
})();
