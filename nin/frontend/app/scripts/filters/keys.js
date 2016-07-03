(function() {
  'use strict';
  angular.module('nin').filter('keys', function(){
    return function(input){
      if(!angular.isObject(input)){
        return [];
      }
      return Object.keys(input);
    };
  });

  angular.module('nin').filter('keyslength', function(){
    return function(input){
      if(!angular.isObject(input)){
        return 0;
      }
      return Object.keys(input).length;
    };
  });
})();
