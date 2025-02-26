import EventEmitter from 'events'

export interface Port<OutgoingMessage = any, IncomingMessage = any> {
  send(message: OutgoingMessage): void
  onMessage(callback: (message: IncomingMessage) => void): void
  onDisconnect(callback: () => void): void
}

class FakePort implements Port {
  private emitter: EventEmitter
  private id: string
  private otherId: string

  static createPaired(): [FakePort, FakePort] {
    const emitter = new EventEmitter()
    const port1 = new FakePort(emitter, 'port1', 'port2')
    const port2 = new FakePort(emitter, 'port2', 'port1')

    return [port1, port2]
  }

  private constructor(emitter: EventEmitter, id: string, otherId: string) {
    this.emitter = emitter
    this.id = id
    this.otherId = otherId
  }

  send(message: any): void {
    this.emitter.emit(this.otherId, message)
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

export interface CommunicationManager {
  clientConnect(): Port
  addClientConnectListener(callback: (backgroundPort: Port) => void): void
}

export class FakeCommunicationManager implements CommunicationManager {
  private callback: (backgroundPort: Port) => void = () => {}

  clientConnect() {
    const [clientPort, backgroundPort] = FakePort.createPaired()
    this.callback(backgroundPort)
    return clientPort
  }

  addClientConnectListener(callback: (backgroundPort: Port) => void) {
    this.callback = callback
  }
}
