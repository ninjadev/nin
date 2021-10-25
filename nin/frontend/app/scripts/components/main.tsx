const Bottom = require('./bottom');
const MenuBar = require('./menubar');
const GraphEditor = require('./editor/GraphEditor');
const DemoPlayer = require('./demoplayer');
const commands = require('../commands');
const demo = require('../demo');
require('../utils/render');

import * as React from "react";
import {SocketController, WebSocketEvent} from '../socket';

declare const Loader: any;
declare const NIN: any;

export default class Main extends React.Component<any, any> {
  themes: string[];
  fileCache: Object;
  startupSound: any;
  socketController: any;

  constructor(props) {
    super(props);

    this.themes = [
      'dark',
      'light'
    ];

    const socketController = new SocketController();
    this.socketController = socketController;

    this.fileCache = {};

    this.state = {
      graph: undefined,
      selectedTheme: localStorage.getItem('selectedTheme') || 'dark',
      fullscreen: false,
      showFramingOverlay: false,
      volume: localStorage.getItem('nin-mute') ? localStorage.getItem('nin-mute') : 0,
      mute: localStorage.getItem('nin-mute') ? true : false,
      globalJSErrors: {},
      globalShaderErrors: {},
    };

    demo.music.setVolume(1 - this.state.mute);
    demo.registerMainComponent(this);

    commands.on('playSplashScreen', () => {
      this.startupSound = new Audio();
      this.startupSound.autoplay = true;
      this.startupSound.src = '/audio/nin.wav';
    });

    if (!this.state.mute) {
      commands.playSplashScreen();
    }

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
      this.setState({selectedTheme: theme});
      localStorage.setItem('selectedTheme', theme);
    });

    commands.on('generate', (type, name) => {
      socketController.sendEvent('generate', {type: type, name: name});
    });

    commands.on('toggleFramingOverlay', () => {
      this.setState({showFramingOverlay: !this.state.showFramingOverlay});
    });

    commands.on('toggleFullscreen', () => {
      this.setState({fullscreen: !this.state.fullscreen});
    });

    commands.on('toggleMusic', () => {
      if (!this.state.mute) {
        this.setState({volume: demo.music.getVolume()});
        localStorage.setItem('nin-mute', '1');
        demo.music.setVolume(0);
      } else {
        localStorage.removeItem('nin-mute');
        demo.music.setVolume(this.state.volume);
      }
      this.setState({mute: !this.state.mute});
    });

    socketController.socket.onopen = function() {
      console.log('nin socket connection established', arguments);
    };

    socketController.on('add change', (event: WebSocketEvent) => {
      try {
        switch (event.type) {
        case 'graph':
          let graph = JSON.parse(event.content);

          for (let nodeInfo of graph) {
            let node = demo.nm.createNode(nodeInfo);
            if (node) {
              demo.nm.insertOrReplaceNode(node);
              continue;
            }
            // This hack only works due to not-yet received
            // nodes created through generate not having
            // any connections / friends.
            setTimeout(() => {
              let node = demo.nm.createNode(nodeInfo);
              demo.nm.insertOrReplaceNode(node);
            }, 200);
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

          this.setState({graph});
          Loader.start(function() {}, function() {});
          break;

        case 'camera':
          for (let key in demo.nm.nodes) {
            if (demo.nm.nodes[key] instanceof NIN.THREENode) {
              if (demo.nm.nodes[key].options.camera == event.name) {
                demo.nm.nodes[key].initializeCamera(event.content);
              }
            }
          }
          break;

        case 'shader':
          /* kill all info about all previous programs so that we can clear errors */
          demo.renderer.info.programs.splice(0, demo.renderer.info.programs.length);

          var indirectEval = eval;
          indirectEval(event.content);

          for (const nodeInfo of this.state.graph) {
            if (nodeInfo.options && nodeInfo.options.shader === event.name) {
              var node = demo.nm.createNode(nodeInfo);
              demo.nm.insertOrReplaceNode(node);
            }
          }

          demo.nm.update(demo.looper.currentFrame);
          demo.nm.render(demo.renderer);
          Loader.start(function() {}, function() {});
          break;

        case 'node':
          this.fileCache[event.name] = event.content;
          var indirectEval = eval;
          indirectEval(event.content);

          if(this.state.graph) {
            for(var i = 0; i < this.state.graph.length; i++) {
              var nodeInfo = this.state.graph[i];
              if(nodeInfo.type == event.name) {
                var node = demo.nm.createNode(nodeInfo);
                demo.nm.insertOrReplaceNode(node);
              }
            }
          }

          demo.nm.update(demo.looper.currentFrame);
          demo.nm.render(demo.renderer);
          Loader.start(function() {}, function() {});
          break;
        }

        const globalJSErrors = (Object as any).assign({}, this.state.globalJSErrors);
        delete globalJSErrors[event.name];
        this.setState({globalJSErrors});
      } catch (e) {
        e.context = "WS load of " + event.name + " failed";
        e.name = event.name;

        const globalJSErrors = (Object as any).assign({}, this.state.globalJSErrors);
        globalJSErrors[event.name] = e;
        this.setState({globalJSErrors});
      }
    });

    socketController.socket.onclose = e => {
      console.log('nin socket connection closed', e);
      this.setState({disconnected: true});
    };
  }

  render() {
    return (
      <div>
        <link rel="stylesheet" href={`styles/${this.state.selectedTheme}.css`} />

        { this.state.disconnected
          ? <div className="disconnect-banner">
              Disconnected from the nin backend!
              Try refreshing, and perhaps restarting <code>nin</code> too.
            </div>
          : null
        }

        <MenuBar />

        <div className='top-panel'>
          <div className='node-area-container'>
            <div className='graph-editor'>
              <GraphEditor
                graph={this.state.graph}
                demo={demo}
                nodes={demo.nm.nodes}
                socket={this.socketController}
                >
              </GraphEditor>
            </div>
          </div>

          <DemoPlayer
            fileCache={this.fileCache}
            demo={demo}
            fullscreen={this.state.fullscreen}
            showFramingOverlay={this.state.showFramingOverlay}
            globalJSErrors={this.state.globalJSErrors}
            globalShaderErrors={this.state.globalShaderErrors}
            />
        </div>

        <Bottom
          selectedTheme={this.state.selectedTheme}
          demo={demo}
          />

      </div>);
  }
}
