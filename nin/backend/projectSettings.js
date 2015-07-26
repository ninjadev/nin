var fs = require('fs');

function load(projectPath) {
  var projectSettings = fs.readFileSync(projectPath + '/nin.json', 'utf8');
  var projectSettingsFile = "PROJECT.data = " + projectSettings.trim() + ";";
  fs.writeFileSync(
    projectPath + '/gen/projectSettings.js',
    new Buffer(projectSettingsFile)
  );
}

module.exports = {load: load};
