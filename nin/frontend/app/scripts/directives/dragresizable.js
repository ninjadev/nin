angular.module('nin').directive('dragresizable', function () {

  var resizableConfig = {
    containment: 'parent',
    handles: 'e, w'
  };

  var draggableConfig = {
    containment: 'parent',
    axis: 'x',
    scroll: true
  };

  return {
    restrict: 'A',
    scope: {
      callback: '&onDragResize'
    },
    link: function postLink(scope, element, attrs) {
      element.resizable(resizableConfig);
      element.draggable(draggableConfig);
      element.on('resizestop dragstop', function (evt, ui) {
        if(scope.callback) {
          scope.callback();
        }
      });
    }
    };
});
