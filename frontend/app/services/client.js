angular.module('nin').service('client', function($http){

    var that = this;
    function connect(){
        var sock = new SockJS('http://localhost:8080/sockjs');
        sock.onopen = function() {
            fire('open');
            a=sock;
        };
        sock.onmessage = function(e) {
            var message = JSON.parse(e.data);
            console.log('getting message', message);
            if(message.type in {'add':0, 'change':0}){
                $http.get('//localhost:9999' + message.path)
                .success(function(data){
                    fire('change:' + message.path, data);
                });
            }

        };
        sock.onclose = function() {
            fire('close');
        };
        that.send = function(data){
            sock.send(JSON.stringify(data));
        }
    }

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

    connect();
});
