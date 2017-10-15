const p = require('path');
const chalk = require('chalk');
const chokidar = require('chokidar');
const shaderGen = require('./shadergen');


function watch(projectPath, cb) {
  let paths = ['res/graph.json'];

  /* sent only once, must come first */
  cb('add', {path: 'res/graph.json'});

  const watcher = chokidar.watch(
    [ 'src/',
      'lib/',
      'res/*.camera.json'],
    {
      ignored: [/[\/\\]\./, /\/shaders\//, /___jb_tmp___/, /___jb_old___/],
      persistent: true,
      ignoreInitial: false,
      cwd: projectPath,
      useFsEvents: true,
      usePolling: true,
      interval: 200
    }
  );

  let logFileChanges = false;
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
      console.log(chalk.yellow('Change in project detected: ') +
                  chalk.cyan(event) +
                  ', ' +
                  chalk.magenta(path));
    }

    cb(event, {path});

    // Maintain list of files that the frontend will need to load initially
    if (event === 'add') {
      paths.push(path);
    } else if (event === 'delete') {
      const i = paths.indexOf(path);
      if (i > -1) {
        paths.splice(i, 1);
      }
    }
  });


  const shaderWatcher = chokidar.watch('src/shaders/', {
    ignored: /[\/\\]\./,
    persistent: true,
    ignoreInitial: true,
    cwd: projectPath
  });

  shaderWatcher.on('all', async function(event, path) {
    if (event === 'add' || event === 'change') {
      const pathParts = path.split(p.sep);
      console.log(chalk.yellow('Recompiling shaders:'), chalk.magenta(pathParts[2]));

      const out = await shaderGen(projectPath);
      cb(event, {path, out});
    }
  });

  shaderGen(projectPath);

  return {paths};
}

module.exports = watch;
