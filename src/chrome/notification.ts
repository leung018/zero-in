import type { ActionService } from '../infra/action'
import type { DesktopNotifier } from '../infra/desktop_notification'

// Require manual testing
export class ChromeDesktopNotificationService implements ActionService {
  trigger(): void {
    chrome.notifications.clear(NOTIFICATION_ID).then(() => {
      chrome.notifications.create(NOTIFICATION_ID, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icon.png'),
        title: 'Task Concentrator',
        message: "Time's up!"
      })
    })
  }
}

const NOTIFICATION_ID = 'time-up'

export class ChromeDesktopNotifier implements DesktopNotifier {
  triggerNotification(notificationId: string, buttons: { title: string }[]): void {
    chrome.notifications.clear(notificationId).then(() => {
      chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icon.png'),
        title: 'Task Concentrator',
        message: "Time's up!",
        buttons
      })
    })
  }

  addButtonClickedListener(listener: (notificationId: string, buttonIndex: number) => void): void {
    chrome.notifications.onButtonClicked.addListener(listener)
  }

  getTriggerCount(): number {
    return 0
  }
}
