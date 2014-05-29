angular.module('nin').directive('demo', function() {
  return {
    restrict: 'E',
    template: '<div class=demo-container></div>',
    link: function(scope, element, attrs) {
      console.log('demo was linked!');
      var demo = bootstrap({
        rootPath: '//localhost:9999/',
        container: element[0].children[0]
      });
      console.log(d = demo);
      demo.start();
    }
  };
});
