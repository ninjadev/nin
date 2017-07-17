const SockJS = require('sockjs-client');

interface GraphEvent {
  type: 'graph',
  content: string,
  name: string,
}

interface CameraEvent {
  type: 'camera',
  content: string,
  name: string,
}

interface ShaderEvent {
  type: 'shader',
  content: string,
  name: string,
}

interface NodeEvent {
  type: 'node',
  content: string,
  name: string,
}

export type WebSocketEvent = GraphEvent | CameraEvent | ShaderEvent | NodeEvent;

export class SocketController {
  handlers: object;
  socket: any;

  constructor() {
    this.socket = new SockJS('/socket');

    this.handlers = {};

    this.socket.onmessage = message => {
      var event = JSON.parse(message.data);
      for(var i = 0; i < this.handlers[event.type].length; i++) {
        this.handlers[event.type][i](<WebSocketEvent> event.data);
      }
    };
  }

  on(event: string, handler: (WebSocketEvent) => void): void {
    if (event.indexOf(' ') != -1) {
      const events = event.split(' ');
      for (const event of events) {
        this.on(event, handler);
      }
      return;
    }
    if (!(event in this.handlers)) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
  }

  off(event, handler) {
    for (var i = 0; i < this.handlers[event].length; i++) {
      if (handler == this.handlers[event][i]) {
        this.handlers[event].splice(i, 1);
        return;
      }
    }
  }

  sendEvent(event, data) {
    this.socket.send(JSON.stringify({
      type: event,
      data: data
    }));
  }
}
