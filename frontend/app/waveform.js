function initWaveform(url){
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    var context = new AudioContext();

    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    var waveform;
    var waveformOverlay;

    request.onload = function() {
        context.decodeAudioData(request.response, function(buffer) {
            var channelData = buffer.getChannelData(1);
            var container = document.getElementById("music-container");
            var containerOverlay = document.getElementById("music-container-overlay");

            $(document).keypress(function(e){
                /* spacebar */
                if(e.keyCode == 32){
                    music.paused ? music.play() : music.pause();
                    loopRunner();
                }
            });

            function containerclick(e){
                var coords = relMouseCoords(e, container); 
                console.log(music.duration * coords.x / waveform.width);
                music.currentTime = music.duration * coords.x / waveform.width;
                loopRunner();
            }
            container.addEventListener('click', containerclick);
            containerOverlay.addEventListener('click', containerclick);

            function recreateWaveform() {
                container.innerHTML = '';
                waveform = new Waveform({
                    container: container,
                    interpolate: true,
                    innerColor: '#060',
                    outerColor: '#222',
                    data: channelData
                });
                waveformOverlay = new Waveform({
                    container: containerOverlay,
                    interpolate: true,
                    innerColor: '#0f0',
                    outerColor: '#222',
                    data: channelData
                });
            }
            window.addEventListener('resize', recreateWaveform);
            music.addEventListener('timeupdate', timeupdate);
            function timeupdate(){
                containerOverlay.style.width = (100 * 10 / 12 * music.currentTime / music.duration) + '%';
            }
            recreateWaveform();
            timeupdate();
        }, function(e){console.log(e, 'error')});

    }
    request.send();
};
