function initWaveform(url){
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var context = new AudioContext();

    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    var waveform;

    request.onload = function() {
        context.decodeAudioData(request.response, function(buffer) {
            var channelData = buffer.getChannelData(1);
            var container = document.getElementById("music-container");

            window.addEventListener('keypress', function(e){
                /* spacebar */
                if(e.keyCode == 32){
                    music.paused ? music.play() : music.pause();
                }
            });

            container.addEventListener('click', function(e){
                var coords = relMouseCoords(e, container); 
                console.log(music.duration * coords.x / waveform.width);
                music.currentTime = music.duration * coords.x / waveform.width;
            });

            function recreateWaveform() {
                container.innerHTML = '';
                waveform = new Waveform({
                    container: container,
                         interpolate: true,
                         innerColor: function(x, y){
                             return x < music.currentTime/music.duration ? '#0f0' : '#060';
                         },
                         outerColor: '#222',
                         data: channelData
                });
            }
            window.addEventListener('resize', recreateWaveform);
            music.addEventListener('timeupdate', recreateWaveform);

            recreateWaveform();
        }, function(e){console.log(e, 'error')});

    }
    request.send();
};
