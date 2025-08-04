import { FakeClock } from '@/utils/clock'
import { BrowserAlarmsOperator } from '../browser/alarms_operator'
import { AlarmsOperator, FakeAlarmsOperator } from './operator'

type AlarmListeners = Record<string, () => void>

export class AlarmsManager {
  private operator: AlarmsOperator

  static create({ listeners }: { listeners: AlarmListeners }): AlarmsManager {
    return new AlarmsManager({ listeners, operator: new BrowserAlarmsOperator() })
  }

  static createFake({
    listeners,
    stubbedDate = new Date(),
    fakeClock = new FakeClock()
  }: {
    listeners: AlarmListeners
    stubbedDate?: Date
    fakeClock?: FakeClock
  }): AlarmsManager {
    return new AlarmsManager({
      listeners,
      operator: new FakeAlarmsOperator({
        stubbedDate,
        fakeClock
      })
    })
  }

  private constructor({
    listeners,
    operator
  }: {
    listeners: AlarmListeners
    operator: AlarmsOperator
  }) {
    this.operator = operator
    this.operator.addListener((alarmName) => {
      listeners[alarmName]()
    })
  }

  async createAlarm(name: string, option: { when: Date }): Promise<void> {
    await this.operator.createAlarm(name, option)
  }
}
