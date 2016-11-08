class ScriptReloader {
  reload(path, callback) {
    $.getScript(path, callback);
  }
}

module.exports = ScriptReloader;
