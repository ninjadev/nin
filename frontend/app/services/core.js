angular.module('nin').service('core', function(client){

    var renderer = new THREE.WebGLRenderer({antialias: true});
    document.getElementById('preview').appendChild(renderer.domElement);
    renderer.autoClear = false;

    $(window).resize(function(){
        var width = $('#preview').width();
        var height = $('#preview').height();
        if(width / 16 * 9 > height){
            renderer.domElement.style.marginLeft = ($('#preview').width() - width) / 2 + 'px';
            width = height / 9 * 16;
        }else{
            height = width / 16 * 9;
            renderer.domElement.style.marginTop = ($('#preview').height() - height) / 2 + 'px';
        }

        renderer.setSize(width, height);
    });
    $(window).resize();

    var fullscreen = false;
    $(document).keypress(function(e){
        if(e.which == 102){
            if(!fullscreen){
                $('#preview').addClass('fullscreen');
            } else {
                $('#preview').removeClass('fullscreen');
            }
            $(window).resize();
            fullscreen = !fullscreen;
        }
    });

    function fire(e, data){
        for(var regex in listeners){
            if(new RegExp(regex.slice(1, -1)).test(e)){
                for(var i in listeners[regex]){
                    listeners[regex][i](data, e);
                }
            }
        }
    }

    var listeners = {};
    this.on = function(e, callback){
        if(!(e in listeners)) {
            listeners[e] = []; 
        }
        listeners[e].push(callback);
    }

    var listeners = {};

    var that = this;
    client.on(/change:\/src\/.*\.js/, function(data, e){
        var path = e.slice(7);
        that.update(path);
    });

    this.update = function update(path){
        var script = document.createElement('script');
        script.onload = function(){
            for(var i=0;i<listeners[path].length;i++){
                listeners[path][i]();
            }
        }
        script.src = '//localhost:9999' + path;
        document.body.appendChild(script);
    }

    this.change = function change(path, cb){
        if(!listeners[path]){
            listeners[path] = [];
        }
        listeners[path].push(cb);
    }

    var that = this;
    this.setActiveLayer = function setActiveLayer(layer) {
        $('.layer').removeClass('active');
        $(layer).addClass('active');
        var index = $(layer).attr('data-i');
        fire('setActiveLayer', {layer: that.layers[index], index: index});
    }

    var that = this;
    loopRunner = function loopRunner(){
        !music.paused && requestAnimationFrame(loopRunner);

        for(var i=0;i<that.layers.length;i++){
            var layer = that.layers[i];
            if(layer.start <= music.currentTime && layer.end >= music.currentTime){
                layer.layer.update(music.currentTime);
                layer.layer.render(renderer);
            }
        }
    }

    this.layers = [];

    var that = this;
    client.on(/change:\/res\/layers\.json/, function(data){
        that.layers = data;
        for(var i=0;i<data.length;i++){
            var layer = data[i];
            if((1,eval)('typeof ' + layer.name) != 'undefined'){
                layer.layer = new ((1, eval)(layer.name))();
                if (layer.options){
                    for(var j=0;j<layer.options.length;j++){
                        var option = layer.options[j];
                        layer.layer[option.name] = option.value;
                    }
                }
            } else {
                var cb = arguments.callee;
                setTimeout(function(){ cb(data);}, 100);
            }
            that.change('/src/' + layer.name + '.js', (function(layer){
            return function(){
                layer.layer = new ((1, eval)(layer.name))();
            };})(layer));
        }
    });

});
