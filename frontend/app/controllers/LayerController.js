angular.module('nin', [])
.controller("LayerController", function LayerController($scope, core, client) {

    client.on(/change:\/res\/layers\.json/, function(data){
        $scope.layers = data;

        for(var i=0;i<data.length;i++){
            var layer = data[i];
            layer.cssWidth = 100 * (layer.end - layer.start) / music.duration;
            layer.cssLeft = 100 * layer.start / music.duration;
            layer.i = i;
        }


        function cssToSeconds(container, css){
            var px = css.slice(0,-2);
            return music.duration * px / container.width();
        }

        function save(e, ui){
            var el = $(e.target);
            var container = el.parent();
            var layer = container.parent();
            client.send({
                type: 'layer',
                index: layer.attr('data-i'),
                start: cssToSeconds(container, el.css('left')),
                end: cssToSeconds(container, el.css('left')) +
                     cssToSeconds(container, el.css('width'))
            });
        }

        setTimeout(function(){
            $('.layer-box').draggable({
                axis: 'x',
                containment: 'parent',
                stop: save
            }).resizable({
                containment: 'parent',
                handles: 'e, w',
                stop: save
            });

            $('.meta').click(function(){
                core.setActiveLayer($(this).parent());
            });
        }, 0);

    });
});
