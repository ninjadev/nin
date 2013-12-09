angular.module('nin')
.controller("OptionsController", function OptionsController($scope, core, client) {
    $scope.options = {};
    $scope.index = -1;
    core.on('setActiveLayer', function(data) {
        var layer = data.layer;
        var index = data.index;
        $scope.$apply(function(){
            $scope.options = layer.options;
            $scope.index = index;
        });
    });

    $scope.save = function(){
        console.log('saving...', $scope.index, $scope.options);
        client.send({
            type: 'layer options',
            index: $scope.index,
            options: $scope.options
        });
    }
});

