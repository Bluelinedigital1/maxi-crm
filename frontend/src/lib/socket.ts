import Cookies from 'js-cookie';

type SocketCallback = (payload: any) => void;

class MockSocket {
  private listeners: Record<string, Set<SocketCallback>> = {};
  public connected = false;

  public connect() {
    this.connected = true;
    console.log('[Mock Socket] Connected to virtual socket server');
    return this;
  }

  public disconnect() {
    this.connected = false;
    console.log('[Mock Socket] Disconnected from virtual socket server');
    return this;
  }

  public on(event: string, callback: SocketCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event].add(callback);
    return this;
  }

  public off(event: string, callback?: SocketCallback) {
    if (!this.listeners[event]) return this;
    if (callback) {
      this.listeners[event].delete(callback);
    } else {
      delete this.listeners[event];
    }
    return this;
  }

  public emit(event: string, payload: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(payload));
    }
    return this;
  }
}

const mockSocketInstance = new MockSocket();

export function getSocket() {
  return mockSocketInstance;
}

export function connectSocket() {
  return mockSocketInstance.connect();
}

export function disconnectSocket() {
  mockSocketInstance.disconnect();
}

export function triggerMockSocketMessage(leadId: string, leadName: string, message: any) {
  mockSocketInstance.emit('message:new', {
    leadId,
    leadName,
    message,
  });
}
