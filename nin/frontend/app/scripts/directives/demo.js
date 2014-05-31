angular.module('nin').directive('demo', function(demo) {
  return {
    restrict: 'E',
    template: '<div class=demo-container></div>',
    link: function(scope, element, attrs) {
      console.log('demo was linked!');
      demo.setContainer(element[0].children[0]);
      setTimeout(function(){
        demo.start();
      }, 0);
    }
  };
});
