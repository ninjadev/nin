function errorExcerpt(program) {
  const shader = program.diagnostics.fragmentShader.log
    ? program.diagnostics.fragmentShader
    : program.diagnostics.vertexShader;

  console.log(shader);
  const coordinates = shader.log.split(" ")[1].split(":");
  var lineNumber = +coordinates[1] - shader.prefix.split("\n").length + 1;
  var column = +coordinates[0];
  var html = "";
  function pad(number) {
    number = "" + number;
    while (number.length < ("" + lineNumber).length + 1) {
      number = " " + number;
    }
    return number;
  }

  const lines = program.cacheKey.split("\n");

  function hilightError(line, columnNumber) {
    return line.replace(
      new RegExp("(.{" + (columnNumber - 1) + "})(.[a-zA-Z0-9_]*)"),
      "$1<strong>$2</strong>"
    );
  }
  if (lineNumber > 1) {
    html +=
      '<span class="muted">' +
      pad(lineNumber - 1) +
      ". | " +
      lines[lineNumber - 2] +
      "</span>\n";
  }
  html +=
    "" +
    pad(lineNumber) +
    ". | " +
    hilightError(lines[lineNumber - 1], column) +
    "\n";
  if (lineNumber < lines.length) {
    html +=
      '<span class="muted">' +
      pad(lineNumber + 1) +
      ". | " +
      lines[lineNumber] +
      "</span>\n";
  }
  return html;
}

module.exports = errorExcerpt;
