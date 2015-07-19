(function() {
  'use strict';

  angular.module('nin').directive('dragresizable', function () {

    var resizableConfig = {
      containment: 'parent',
      handles: 'w, e',
      scroll: true
    };

    var draggableConfig = {
      containment: 'parent',
      axis: 'x'
    };

    return {
      restrict: 'A',
      scope: {
        callback: '&onDragResize'
      },
      link: function postLink(scope, element) {
        /* seems to be buggy when both draggable and resizable */
        //element.draggable(draggableConfig);
        element.resizable(resizableConfig);
        element.on('resizestop dragstop', function(event, ui) {
          if(scope.callback) {
            scope.callback({event: event, ui: ui});
          }
        });
      }
    };
  });
})();
