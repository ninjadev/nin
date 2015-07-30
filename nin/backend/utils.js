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

// Authored by CMS at
// http://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case/2970667#2970667
function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
    if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
    return index == 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

function mergeOptions(input, defaults) {
  var output = {};
  for (var key in defaults) {
    output[key] = defaults[key];
  }
  for (var key in input) {
    output[key] = input[key];
  }
  return output;
}

module.exports = {
  findProjectRoot: findProjectRoot,
  camelize: camelize,
  mergeOptions: mergeOptions
};
