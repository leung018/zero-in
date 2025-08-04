import { AlarmsOperator } from '../alarms/operator'

export class BrowserAlarmsOperator implements AlarmsOperator {
  addListener(callback: (alarmName: string) => void): void {
    browser.alarms.onAlarm.addListener((alarm) => {
      callback(alarm.name)
    })
  }

  async createAlarm(name: string, option: { when: Date }): Promise<void> {
    return browser.alarms.create(name, {
      when: option.when.getTime()
    })
  }
}
