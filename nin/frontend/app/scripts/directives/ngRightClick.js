/* Inspired by http://stackoverflow.com/a/15732476 */

function ngRightClick($parse) {
  return function(scope, element, attrs) {
    var fn = $parse(attrs.ngRightclick);
    element.bind('contextmenu', function(event) {
      scope.$apply(function() {
        event.preventDefault();
        fn(scope, {$event: event});
      });
    });
  };
}

module.exports = ngRightClick;
