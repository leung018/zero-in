export interface CommunicationManager {
  clientConnect(): Port
  onNewClientConnect(callback: (backgroundPort: Port) => void): void
}

export interface Port<OutgoingMessage = any, IncomingMessage = any> {
  send(message: OutgoingMessage): Promise<void>
  onMessage(callback: (message: IncomingMessage) => void): void
  onDisconnect(callback: () => void): void
  disconnect(): void
}

export class FakeCommunicationManager implements CommunicationManager {
  private callback: (backgroundPort: Port) => void = () => {}

  clientConnect() {
    const [clientPort, backgroundPort] = FakePort.createPaired()
    this.callback(backgroundPort)
    return clientPort
  }

  onNewClientConnect(callback: (backgroundPort: Port) => void) {
    this.callback = callback
  }
}

class FakePort implements Port {
  private emitter: MyEventEmitter
  private id: string
  private otherId: string

  static createPaired(): [FakePort, FakePort] {
    const emitter = new MyEventEmitter()
    const port1 = new FakePort(emitter, 'port1', 'port2')
    const port2 = new FakePort(emitter, 'port2', 'port1')

    return [port1, port2]
  }

  private constructor(emitter: MyEventEmitter, id: string, otherId: string) {
    this.emitter = emitter
    this.id = id
    this.otherId = otherId
  }

  async send(message: any) {
    this.emitter.emit(this.otherId, JSON.parse(JSON.stringify(message)))
  }

  onMessage(callback: (message: any) => void): void {
    this.emitter.on(this.id, callback)
  }

  onDisconnect(callback: () => void): void {
    this.emitter.on(this.id + '-disconnected', callback)
  }

  disconnect() {
    this.emitter.emit(this.otherId + '-disconnected')
    this.emitter.removeAllListeners(this.id)
    this.emitter.removeAllListeners(this.otherId)
  }
}

class MyEventEmitter {
  // Use it instead of Node.js EventEmitter so that have no dependency on Node.js modules in application codes
  private listeners: Record<string, Function[]> = {}

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((listener) => listener(...args))
    }
  }

  on(event: string, listener: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(listener)
  }

  removeAllListeners(event: string) {
    this.listeners[event] = []
  }
}
