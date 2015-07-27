var spawn = require('child_process').spawn;

var render = function(projectPath) {
  var avconv = spawn('avconv', [
  '-y',
  '-r', '60',
  '-i', projectPath + '/bin/render/%07d.png',
  '-i', projectPath + '/res/music.mp3',
  '-c:v', 'libx264',
  '-c:a', 'copy',
  '-crf', '16',  
  projectPath + '/bin/render/render.mp4']);
  avconv.stdout.on('data', function(data) {
    console.log(data.toString());
  });
  avconv.stderr.on('data', function(data) {
    console.log(data.toString());
  });
}

module.exports = {render: render};
