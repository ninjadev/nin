angular.module('nin').factory('demo', function(){
  var demo = bootstrap({
    rootPath: '//localhost:9999/',
  });
  return demo;
});
