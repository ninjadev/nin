angular.module('stuff', [])
.controller("LayerController", function LayerController($scope) {
    $scope.layers = [
        {
            "name": "Background",
        },
        {
            "name": "3D model",
        },
        {
            "name": "bloom",
        },
        {
            "name": "Letters",
        },
        {
            "name": "noise",
        }
    ];
});
