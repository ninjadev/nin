function errorExcerpt(error, fileCache) {
  if (fileCache === undefined || !(error.name in fileCache)) {
    return;
  }

  var lines = fileCache[error.name].split('\n');
  var coordinates = error.stack.split('\n')[1].trim().replace(/.*:(\d+:\d+)\)/, '$1').split(':');
  var lineNumber = +coordinates[0];
  var column = +coordinates[1];
  var html = '';
  function pad(number) {
    number = '' + number;
    while(number.length < ('' + lineNumber).length + 1) {
      number = ' ' + number;
    }
    return number;
  }

  function hilightError(line, columnNumber) {
    console.log(line, columnNumber);
    return line.replace(new RegExp('(.{' + (columnNumber - 1) + '})(.[a-zA-Z0-9_]*)'), '$1<strong>$2</strong>');
  }
  if(lineNumber > 1) {
    html += '<span class="muted">' + pad(lineNumber - 1) + '. | ' + lines[lineNumber - 2] + '</span>\n';
  }
  html += '' + pad(lineNumber) + '. | ' + hilightError(lines[lineNumber - 1], column) + '\n';
  if(lineNumber < lines.length) {
    html += '<span class="muted">' + pad(lineNumber + 1) + '. | ' + lines[lineNumber] + '</span>\n';
  }
  return html;
}

module.exports = errorExcerpt;
