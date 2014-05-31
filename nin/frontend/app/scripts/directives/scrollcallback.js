angular.module('nin').directive('scrollcallback', function($interval, demo) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      element.on('scroll', function(event) {
        scope[attrs.scrollcallback](event);
      });
    }
  };
});
