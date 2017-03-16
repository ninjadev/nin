class MainCtrl {
  constructor(socket, demo, commands, $window, $timeout, render) {
    this.themes = [
      'dark',
      'light'
    ];

    this.fileCache = {};

    this.selectedTheme = localStorage.getItem('selectedTheme') || 'dark';
    commands.on('selectTheme', theme => {
      var foundTheme = false;
      for(var i = 0; i < this.themes.length; i++) {
        if(this.themes[i] == theme) {
          foundTheme = true;
          continue;
        }
      }
      if(!foundTheme) {
        return;
      }
      this.selectedTheme = theme;
      localStorage.setItem('selectedTheme', theme);
    });

    this.demo = demo;
    this.fullscreen = false;
    this.inspectedLayer = null;
    this.mute = localStorage.getItem('nin-mute') ? true : false;
    if (localStorage.hasOwnProperty('nin-volume')) {
      this.volume = +localStorage.getItem('nin-volume');
    } else {
      this.volume = 1;
    }

    commands.on('generate', (type, name) => {
      socket.sendEvent('generate', {type: type, name: name});
    });

    commands.on('toggleFullscreen', () => {
      this.fullscreen = !this.fullscreen;
    });

    commands.on('toggleMusic', () => {
      this.mute = !this.mute;
      if (this.mute) {
        localStorage.setItem('nin-mute', 1);
      } else {
        localStorage.removeItem('nin-mute');
      }
    });

    socket.onopen = function() {
      console.log('nin socket connection established', arguments);
    };

    /* http://stackoverflow.com/a/7616484 */
    function hash(string) {
      var h = 0, i, chr, len;
      if (string.length === 0) return h;
      for (i = 0, len = string.length; i < len; i++) {
        chr   = string.charCodeAt(i);
        h = ((h << 5) - h) + chr;
        h |= 0; // Convert to 32bit integer
      }
      return h;
    }

    var layerShaderDependencies = {};
    this.globalJSErrors = this.globalJSErrors || {};
    socket.on('add change', event => {
      try {
        switch (event.type) {
        case 'graph':
          let graph = JSON.parse(event.content);

          for (let nodeInfo of graph) {
            try {
              let node = demo.nm.createNode(nodeInfo);
              demo.nm.insertOrReplaceNode(node);
            } catch (e) {
              // This hack only works due to not-yet received
              // nodes created through generate not having
              // any connections / friends.
              $timeout(function () {
                let node = demo.nm.createNode(nodeInfo);
                demo.nm.insertOrReplaceNode(node);
              }, 200);
            }
          }

          for (let nodeInfo of graph) {
            for (let inputName in nodeInfo.connected) {
              let fromNodeId = nodeInfo.connected[inputName].split('.')[0];
              let toNodeId = nodeInfo.id;
              let outputName = nodeInfo.connected[inputName].split('.')[1];
              demo.nm.connect(
                fromNodeId,
                outputName,
                toNodeId,
                inputName);
            }
          }

          this.graph = graph;
          Loader.start(function() {}, function() {});
          break;

        case 'camera':
          for (let key in demo.nm.nodes) {
            if (demo.nm.nodes[key] instanceof NIN.CameraNode) {
              if (demo.nm.nodes[key].options.path == event.path) {
                demo.nm.nodes[key].initializeCamera(event.content);
              }
            }
          }
          break;

        case 'shader':
          var indirectEval = eval;
          this.fileCache[event.path] = event.content;
          indirectEval(event.content);

          for (var i in this.layers) {
            var layer = this.layers[i];
            if (layerShaderDependencies[layer.type]) {
              if (layerShaderDependencies[layer.type].indexOf(event.shadername) !== -1) {
                demo.nm.refresh(layer.type);
              }
            }
          }

          demo.nm.update(demo.looper.currentFrame);
          Loader.start(function() {}, function() {});
          break;

        case 'node':
          this.fileCache[event.path] = event.content;
          var indirectEval = eval;
          indirectEval(event.content);

          var splitted = event.path.split('/');
          var filename = splitted[splitted.length - 1];
          var typename = filename.slice(0, -3);
          if(this.graph) {
            for(var i = 0; i < this.graph.length; i++) {
              var nodeInfo = this.graph[i];
              if(nodeInfo.type == typename) {
                var node = demo.nm.createNode(nodeInfo);
                demo.nm.insertOrReplaceNode(node);
              }
            }
          }

          demo.nm.update(demo.looper.currentFrame);
          Loader.start(function() {}, function() {});
          break;
        }

        delete this.globalJSErrors[event.type];
      } catch (e) {
        e.context = "WS load of " + event.path + " failed";
        e.type = event.type;
        e.path = event.path;
        this.globalJSErrors[event.type] = e;
      }
    });

    socket.onclose = e => {
      console.log('nin socket connection closed', e);
      this.disconnected = true;
    };
  }
}

module.exports = MainCtrl;
