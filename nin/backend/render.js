let path = require('path');
let projectSettings = require('./projectSettings');
let ffmpeg = require('fluent-ffmpeg');


let render = function(projectPath) {
  console.time('Total execution time');

  let pngPath = path.join(projectPath, '/bin/render/%07d.png');
  let musicPath = path.join(projectPath, projectSettings.load(projectPath).music.path);
  let destination = path.join(projectPath, '/bin/render/render.mp4');

  ffmpeg()
    .addInput(pngPath)
    .withInputFps(60)

    .addInput(musicPath)
    .audioCodec('copy')

    .videoCodec('libx264')
    .withOutputFps(60)
    .withOutputOption('-pix_fmt', 'yuv420p') // pixel format
    .withOutputOption('-crf', '16') // quality (0 to 51, where 0 is finest)
    .output(destination)

    .on('start', function(commandLine) {
      console.log('Spawned ffmpeg with command: ' + commandLine);
    })
    .on('progress', function(progress) {
      console.log('Processing: ' + progress.percent.toFixed(2) + '% done');
    })
    .on('error', function(err) {
      console.log('Cannot process video: ' + err.message);
    })
    .on('end', function() {
      console.timeEnd('Total execution time');
      console.log('Finished processing. Enjoy the rendered demo!');
      console.log('You\'ll find it right here: ' + destination);
    })

    .run();
};

module.exports = {render: render};
