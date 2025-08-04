import { FakeClock } from '../../utils/clock'
import { CurrentDateService } from '../current_date'

export interface AlarmsOperator {
  addListener(callback: (alarmName: string) => void): void

  createAlarm(name: string, option: { when: Date }): Promise<void>
}

export class FakeAlarmsOperator implements AlarmsOperator {
  private listeners: ((alarmName: string) => void)[] = []
  private currentDateService: CurrentDateService
  private fakeClock: FakeClock

  constructor({ stubbedDate = new Date(), fakeClock = new FakeClock() } = {}) {
    this.currentDateService = CurrentDateService.createFake({ stubbedDate, fakeClock })
    this.fakeClock = fakeClock
  }

  addListener(callback: (alarmName: string) => void): void {
    this.listeners.push(callback)
  }

  async createAlarm(name: string, option: { when: Date }): Promise<void> {
    const subscriptionId = this.fakeClock.subscribeTimeChange(() => {
      if (this.currentDateService.getDate() >= option.when) {
        this.triggerAlarm(name)
        this.fakeClock.unsubscribeTimeChange(subscriptionId)
      }
    })
  }

  private triggerAlarm(name: string): void {
    this.listeners.forEach((listener) => listener(name))
  }
}
