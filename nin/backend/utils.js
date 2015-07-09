var fs = require('fs'),
    path = require('path');

function findProjectRoot(currentPath) {
  var up = '';
  do {
    var base = path.join(currentPath, up),
        manifest = path.join(base, 'nin.json');

    if (fs.existsSync(manifest)) {
      return base;
    }

    up += '../';
  } while (base != path.sep)

  return '';
}

module.exports = {findProjectRoot: findProjectRoot};
