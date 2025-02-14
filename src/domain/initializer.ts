import { ChromeCommunicationManager } from '../chrome/communication'
import { EventName } from '../event'
import {
  FakeCommunicationManager,
  type CommunicationManager,
  type Port
} from '../infra/communication'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'
import { Duration } from './pomodoro/duration'
import { Timer } from './pomodoro/timer'

export class ConnectionListenerInitializer {
  static init() {
    return this.initListener({
      communicationManager: new ChromeCommunicationManager(),
      timerFactory: () => Timer.create()
    })
  }

  static fakeInit({
    scheduler = new FakePeriodicTaskScheduler(),
    communicationManager = new FakeCommunicationManager()
  } = {}) {
    return this.initListener({
      communicationManager,
      timerFactory: () => Timer.createFake(scheduler)
    })
  }

  private static initListener({
    communicationManager,
    timerFactory
  }: {
    communicationManager: CommunicationManager
    timerFactory: () => Timer
  }) {
    communicationManager.addClientConnectListener((backgroundPort: Port) => {
      backgroundPort.addListener((message) => {
        if (message.name == EventName.POMODORO_START) {
          const timer = timerFactory()
          timer.setOnTick((remaining) => {
            backgroundPort.send(remaining.totalSeconds)
          })
          timer.start(new Duration({ seconds: message.initial }))
        }
      })
    })
  }
}
