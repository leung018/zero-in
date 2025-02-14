import EventEmitter from 'events'
import { Timer } from '../domain/pomodoro/timer'
import { EventName } from '../event'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'
import { Duration } from '../domain/pomodoro/duration'

export class Connector {
  static create() {
    return new Connector(() => {
      const chromePort = chrome.runtime.connect()
      return newPort(chromePort)
    })
  }

  static createFake(connect: () => Port) {
    return new Connector(connect)
  }

  readonly connect: () => Port

  private constructor(connect: () => Port) {
    this.connect = connect
  }
}

function newPort(chromePort: chrome.runtime.Port) {
  return {
    send: (message: any) => {
      return chromePort.postMessage(message)
    },
    addListener: (callback: (message: any) => void) => {
      return chromePort.onMessage.addListener(callback)
    }
  }
}

export interface Port {
  send(message: any): void
  addListener(callback: (message: any) => void): void
}

class FakePort implements Port {
  private emitter: EventEmitter
  private id: string
  private otherId: string

  static createPaired(): [Port, Port] {
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

  addListener(callback: (message: any) => void): void {
    this.emitter.on(this.id, callback)
  }
}

export class BackgroundPortListener {
  static initListener() {
    chrome.runtime.onConnect.addListener((chromePort) => {
      const port = newPort(chromePort)
      new BackgroundPortListener(Timer.create).onConnect(port)
    })
  }

  static initFakeListener(
    scheduler: FakePeriodicTaskScheduler = new FakePeriodicTaskScheduler()
  ): Connector {
    return Connector.createFake(() => {
      const [clientPort, serverPort] = FakePort.createPaired()
      new BackgroundPortListener(() => {
        return Timer.createFake(scheduler)
      }).onConnect(serverPort)
      return clientPort
    })
  }

  private timerFactory: () => Timer

  private constructor(timerFactory: () => Timer) {
    this.timerFactory = timerFactory
  }

  private onConnect(port: Port) {
    port.addListener((message) => {
      if (message.name == EventName.POMODORO_START) {
        const timer = this.timerFactory()
        timer.setOnTick((remaining) => {
          port.send(remaining.totalSeconds)
        })
        timer.start(new Duration({ seconds: message.initial }))
      }
    })
  }
}
