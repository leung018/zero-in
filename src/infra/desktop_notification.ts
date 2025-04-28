import { ChromeDesktopNotifier } from '../chrome/desktop_notification'
import type { ActionService } from './action'

export interface DesktopNotifier {
  triggerNotification: (notificationId: string, buttons: { title: string }[]) => void

  addButtonClickedListener: (
    listener: (notificationId: string, buttonIndex: number) => void
  ) => void

  getSimulatedTriggerCount: () => number
}

export class FakeDesktopNotifier implements DesktopNotifier {
  private triggerCount = 0

  triggerNotification(): void {
    this.triggerCount++
  }

  addButtonClickedListener() {}

  getSimulatedTriggerCount() {
    return this.triggerCount
  }
}

export class DesktopNotificationService implements ActionService {
  private onClickStartNext: () => void = () => {}

  private desktopNotifier: DesktopNotifier

  private buttonClickedListener: (notificationId: string, buttonIndex: number) => void = (
    notificationId,
    buttonIndex
  ) => {
    if (notificationId === NOTIFICATION_ID && buttonIndex === 0) {
      this.onClickStartNext()
    }
  }

  static create(): DesktopNotificationService {
    return new DesktopNotificationService({
      desktopNotifier: new ChromeDesktopNotifier()
    })
  }

  static createFake(): DesktopNotificationService {
    return new DesktopNotificationService({
      desktopNotifier: new FakeDesktopNotifier()
    })
  }

  private constructor({ desktopNotifier }: { desktopNotifier: DesktopNotifier }) {
    this.desktopNotifier = desktopNotifier
    this.desktopNotifier.addButtonClickedListener(this.buttonClickedListener)
  }

  trigger(): void {
    this.desktopNotifier.triggerNotification(NOTIFICATION_ID, [
      {
        title: 'Start Next'
      }
    ])
  }

  setOnClickStartNext(onClickStartNext: () => void): void {
    this.onClickStartNext = onClickStartNext
  }

  getSimulatedTriggerCount(): number {
    return this.desktopNotifier.getSimulatedTriggerCount()
  }

  simulateClickStartNext(): void {
    this.simulateButtonClicked(0)
  }

  private simulateButtonClicked(buttonIndex: number): void {
    this.buttonClickedListener(NOTIFICATION_ID, buttonIndex)
  }
}

const NOTIFICATION_ID = 'time-up'
