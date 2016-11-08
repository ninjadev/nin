function stackFormat($sce) {
  return function(error) {
    var lines = error.stack.split('\n');
    var html = '';
    if(error.type == 'layer') {
      console.log(error.type, lines[1]);
      lines[1] = lines[1].replace(/\(eval at .*:(\d+:\d+)\)/, '(' + error.path + ':$1)');
    }
    for(var i = 1; i < lines.length; i++) {
      var line = lines[i];
      line = line.trim();
      line = line.replace(/</g, '&lt;');
      line = line.replace(/>/g, '&gt;');
      line = line.replace(/^at/, '<span class="muted">↳</span>');
      line = line.replace(/https?:\/\/[^\/]+:8000/, '<em>nin</em>');
      line = line.replace(/https?:\/\/[^\/]+:9000\//, '');
      line = line.replace(/bower_components/, '<em>bower</em>');
      line = line.replace(/(\(.*)/, '<span class="muted">$1</span>');
      html += '\n' + line;
    }
    return $sce.trustAsHtml(html);
  };
}

module.exports = stackFormat;
