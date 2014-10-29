var spawn = require('child_process').spawn;

var render = function(projectPath) {
  console.log(projectPath);
  var avconv = spawn('avconv', [
  '-y',
  '-r', '60',
  '-i', projectPath + '/bin/render/%07d.png',
  '-itsoffset', '-00:00:00.133',
  '-i', projectPath + '/res/music.mp3',
  '-c:v', 'libx264',
  '-c:a', 'copy',
  '-crf', '16',  
  '-r', '60',
  projectPath + '/bin/render/render.mp4']);
  avconv.stdout.on('data', function(data) {
    console.log(data.toString());
  });
  avconv.stderr.on('data', function(data) {
    console.log(data.toString());
  });
}

module.exports = {render: render};
