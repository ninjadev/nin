function compile(moduleName, source) { 

  function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }

  function startsWith(str, prefix) {
    return str.indexOf(prefix) === 0;
  }

  var constructorBody = [];
  var outputLines = [];

  var lines = source.split('\n');
  var insideConstructor = true;
  for(var i = 0; i < lines.length; i++) {
    var line = lines[i];

    /* compact whitespace */
    line = line.replace(/\s+/g, ' ');

    /* trim end whitespace */
    line = line.replace(/\s*$/g, '');

    /* translate returns */
    line = line.replace(/^(\s*)< /g, '$1return ');

    /* expand logs */
    line = line.replace(/log\(/g, 'console.log(');

    /* construct methods */
    if(endsWith(line, ') {')) {
      insideConstructor = false;
      var parts = line.split('(', 2);
      var functionName = parts[0];
      var argumentList = '(' + parts[1];
      if(functionName) {
        line = moduleName + '.prototype.' + functionName + ' = function'  + argumentList;
      } else {
        line = 'function'  + argumentList;
      }
    }

    (insideConstructor ? constructorBody : outputLines).push(line);
  }

  return 'function ' + moduleName + '(config) {\n' +
    constructorBody.join('\n') +
    '}\n\n' +
    outputLines.join('\n');
}


module.exports = {compile: compile};
