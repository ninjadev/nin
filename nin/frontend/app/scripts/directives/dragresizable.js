(function() {
  'use strict';

  angular.module('nin').directive('dragresizable', function () {

    var draggableConfig = {
      containment: 'parent'
    };

    return {
      restrict: 'A',
      scope: {
        callback: '&onDragResize'
      },
      link: function postLink(scope, element) {
        element.draggable(draggableConfig);
        element.on('dragstop', function(event, ui) {
          if(scope.callback) {
            scope.callback({event: event, ui: ui});
          }
        });
      }
    };
  });
})();
