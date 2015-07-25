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

function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
    if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    return index == 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

module.exports = {
  findProjectRoot: findProjectRoot,
  camelize: camelize
};
