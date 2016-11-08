function menubar($window) {
  return {
    restrict: 'A',
    scope: {
      menu: '='
    },
    templateUrl: 'views/menubar.html',
    link: function($scope, element, attrs) {
      var oldTopMenuOpen = false;
      $scope.menuState = {open: false, focus: ''};
      $window.document.querySelector('body').addEventListener('click', function() {
        $scope.$apply(function() {
          if(oldTopMenuOpen) {
            $scope.menuState.open = false;
            oldTopMenuOpen = false;
          } else {
            oldTopMenuOpen = true;
          }
        });
      });

    }
  };
}

module.exports = menubar;
