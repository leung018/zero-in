import EventEmitter from 'events'
import { Timer } from '../domain/pomodoro/timer'
import { EventName } from '../event'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'

export class Connector {
  static create() {
    return new Connector(() => {
      const port = chrome.runtime.connect()
      return newConnectionFormPort(port)
    })
  }

  static createFake(newConnection: () => Connection) {
    return new Connector(newConnection)
  }

  readonly newConnection: () => Connection

  private constructor(newConnection: () => Connection) {
    this.newConnection = newConnection
  }
}

function newConnectionFormPort(port: chrome.runtime.Port) {
  return {
    send: (message: any) => {
      return port.postMessage(message)
    },
    addListener: (callback: (message: any) => void) => {
      return port.onMessage.addListener(callback)
    }
  }
}

export interface Connection {
  send(message: any): void
  addListener(callback: (message: any) => void): void
}

class FakeConnection implements Connection {
  private emitter: EventEmitter
  private id: string
  private otherId: string

  static createPaired(): [Connection, Connection] {
    const emitter = new EventEmitter()
    const connection1 = new FakeConnection(emitter, 'connection1', 'connection2')
    const connection2 = new FakeConnection(emitter, 'connection2', 'connection1')

    return [connection1, connection2]
  }

  private constructor(emitter: EventEmitter, id: string, otherId: string) {
    this.emitter = emitter
    this.id = id
    this.otherId = otherId
  }

  send(message: any): void {
    this.emitter.emit(this.otherId, message)
  }

  addListener(callback: (message: any) => void): void {
    this.emitter.on(this.id, callback)
  }
}

export class BackgroundConnectionListener {
  static initListener() {
    chrome.runtime.onConnect.addListener((port) => {
      const connection = newConnectionFormPort(port)
      new BackgroundConnectionListener(Timer.create).onConnect(connection)
    })
  }

  static initFakeListener(
    scheduler: FakePeriodicTaskScheduler = new FakePeriodicTaskScheduler()
  ): Connector {
    return Connector.createFake(() => {
      const [clientConn, serverConn] = FakeConnection.createPaired()
      new BackgroundConnectionListener(() => {
        return Timer.createFake(scheduler)
      }).onConnect(serverConn)
      return clientConn
    })
  }

  private timerFactory: () => Timer

  private constructor(timerFactory: () => Timer) {
    this.timerFactory = timerFactory
  }

  private onConnect(connection: Connection) {
    connection.addListener((message) => {
      if (message.name == EventName.POMODORO_START) {
        const timer = this.timerFactory()
        timer.setOnTick((remaining) => {
          connection.send(remaining)
        })
        timer.start(message.initial)
      }
    })
  }
}
