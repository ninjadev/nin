var chalk = require('chalk');
var chokidar = require('chokidar');
var sg = require('./shadergen');


function watch(projectPath, cb) {
  var paths = [];

  var watcher = chokidar.watch(
    ['src/',
     'lib/',
     'res/graph.json',
     'res/camerapaths.json'], {
    ignored: [/[\/\\]\./, /\/shaders\//],
    persistent: true,
    ignoreInitial: false,
    cwd: projectPath,
    useFsEvents: true,
    usePolling: true,
    interval: 200
  });

  var logFileChanges = false;
  watcher.on('ready', function() {
    logFileChanges = true;
  });

  /* an empty 'add' handler is needed to
   * trigger intial callbacks for all files */
  watcher.on('add', function(){ });

  var graphAlreadyLoaded = false;

  watcher.on('all', function (event, path) {
    if (event === 'unlink') event = 'delete';
    if (event == 'addDir') {
      return;
    }

    if(path == 'res/graph.json') {
      if(graphAlreadyLoaded) {
        return;
      }
      graphAlreadyLoaded = true;
    }

    if (logFileChanges) {
      console.log(chalk.yellow('Change in project detected: ') +
                  chalk.cyan(event) +
                  ', ' +
                  chalk.magenta(path));
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
      console.log(chalk.yellow('Recompiling shaders:'), chalk.magenta(pathParts[2]));
      sg.shaderGen(projectPath, function(out) {
        cb(event, {path: path, out: out});
      });
    }
  });

  sg.shaderGen(projectPath, function() {});

  return {paths: paths};
}

module.exports = watch;
