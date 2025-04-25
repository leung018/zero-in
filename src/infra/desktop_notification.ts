import type { ActionService } from './action'

export interface DesktopNotifier {
  triggerNotification: (notificationId: string, buttons: { title: string }[]) => void

  addButtonClickedListener: (
    listener: (notificationId: string, buttonIndex: number) => void
  ) => void
}

export class FakeDesktopNotifier implements DesktopNotifier {
  private triggerCount = 0

  triggerNotification(): void {
    this.triggerCount++
  }

  addButtonClickedListener() {}

  getTriggerCount() {
    return this.triggerCount
  }
}

export class DesktopNotificationService implements ActionService {
  private onClickStartNext: () => void
  private desktopNotifier: DesktopNotifier
  private buttonClickedListener: (notificationId: string, buttonIndex: number) => void = (
    notificationId,
    buttonIndex
  ) => {
    if (notificationId === NOTIFICATION_ID && buttonIndex === 0) {
      this.onClickStartNext()
    }
  }

  constructor({
    desktopNotifier,
    onClickStartNext
  }: {
    desktopNotifier: DesktopNotifier
    onClickStartNext: () => void
  }) {
    this.desktopNotifier = desktopNotifier
    this.onClickStartNext = onClickStartNext
    this.desktopNotifier.addButtonClickedListener(this.buttonClickedListener)
  }

  trigger(): void {
    this.desktopNotifier.triggerNotification(NOTIFICATION_ID, [
      {
        title: 'Start Next'
      }
    ])
  }

  simulateButtonClicked(buttonIndex: number): void {
    this.buttonClickedListener(NOTIFICATION_ID, buttonIndex)
  }
}

const NOTIFICATION_ID = 'time-up'
