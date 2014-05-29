'use strict';

angular.module('nin')
  .controller('MainCtrl', function ($scope, ScriptReloader) {

    ScriptReloader.reload('//localhost:9999/src/BlankLayer.js', function() {
      console.log('BlankLayer should now be loaded!');
    });

    $scope.layers = [{
      name: 'bogusLayer',
      offset: 22.6,
      width: 47.9
    }];
  });
