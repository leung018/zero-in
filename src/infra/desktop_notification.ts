import type { ActionService } from './action'
import { ChromeDesktopNotifier } from './chrome/desktop_notification'

export interface DesktopNotifier {
  triggerNotification: (notificationId: string, buttons: { title: string }[]) => void

  clearNotification: (notificationId: string) => void

  addButtonClickedListener: (
    listener: (notificationId: string, buttonIndex: number) => void
  ) => void
}

export class DummyDesktopNotifier implements DesktopNotifier {
  triggerNotification(): void {}

  clearNotification(): void {}

  addButtonClickedListener() {}
}

export class DesktopNotificationService implements ActionService {
  // Require a bit manual testing for verifying the integration with ChromeDesktopNotifier

  private onClickStartNext: () => void = () => {}

  private desktopNotifier: DesktopNotifier

  private _isNotificationActive = false

  static create(): DesktopNotificationService {
    return new DesktopNotificationService({
      desktopNotifier: new ChromeDesktopNotifier()
    })
  }

  static createFake(): DesktopNotificationService {
    return new DesktopNotificationService({
      desktopNotifier: new DummyDesktopNotifier()
    })
  }

  private constructor({ desktopNotifier }: { desktopNotifier: DesktopNotifier }) {
    this.desktopNotifier = desktopNotifier
    this.desktopNotifier.addButtonClickedListener(this.buttonClickedListener)
  }

  /**
   * It just indicates that the notification is triggered and haven't being cleared programmatically.
   * When it is active, doesn't meant that the notification must be shown. User may manually close it.
   */
  isNotificationActive(): boolean {
    return this._isNotificationActive
  }

  trigger(): void {
    this.desktopNotifier.triggerNotification(NOTIFICATION_ID, [
      {
        title: 'Start Next'
      }
    ])
    this._isNotificationActive = true
  }

  clear(): void {
    this.desktopNotifier.clearNotification(NOTIFICATION_ID)
    this._isNotificationActive = false
  }

  setOnClickStartNext(onClickStartNext: () => void): void {
    this.onClickStartNext = onClickStartNext
  }

  simulateClickStartNext(): void {
    this.buttonClickedListener(NOTIFICATION_ID, 0)
  }

  private buttonClickedListener: (notificationId: string, buttonIndex: number) => void = (
    notificationId,
    buttonIndex
  ) => {
    if (notificationId === NOTIFICATION_ID && buttonIndex === 0) {
      this.onClickStartNext()
    }
  }
}

const NOTIFICATION_ID = 'time-up'
