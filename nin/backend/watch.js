var chokidar = require('chokidar')
  , sg = require('./shadergen')
  ;


function watch(projectPath, cb) {
  var paths = [];
  console.log('Project path:', projectPath);

  var watcher = chokidar.watch(
    ['src/',
     'res/layers.json',
     'res/camerapaths.json'], {
    ignored: [/[\/\\]\./, /\/shaders\//],
    persistent: true,
    ignoreInitial: false,
    cwd: projectPath
  });

  var logFileChanges = false;
  watcher.on('ready', function() {
    logFileChanges = true;
  });

  /* an empty 'add' handler is needed to
   * trigger intial callbacks for all files */
  watcher.on('add', function(){ });

  watcher.on('all', function (event, path) {
    if (event === 'unlink') event = 'delete';
    if (event == 'addDir') {
      return;
    }

    if (logFileChanges) {
      console.log('Change in project detected: ' + event + ', ' + path);
    }

    cb(event, {path: path});

    // Maintain list of files that the frontend will need to load initially
    if (event === 'add') {
      paths.push(path);
    } else if (event === 'delete') {
      var i = paths.indexOf(path);
      if (i > -1) {
        paths.splice(i, 1);
      }
    }
  });

  var shaderWatcher = chokidar.watch('src/shaders/', {
    ignored: /[\/\\]\./,
    persistent: true,
    ignoreInitial: true,
    cwd: projectPath
  });

  shaderWatcher.on('all', function(event, path) {
    if (event === 'add' || event === 'change') {
      var pathParts = path.split('/');
      console.log('Recompiling shaders:', pathParts[2]);
      sg.shaderGen(projectPath, function() {
        cb(event, {path: path});
      });
    }
  });

  sg.shaderGen(projectPath, function() {});

  return {paths: paths};
}

module.exports = watch;
