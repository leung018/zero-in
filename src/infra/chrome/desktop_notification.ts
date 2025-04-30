import type { DesktopNotifier } from '../desktop_notification'

// Require manual testing
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

  getSimulatedTriggerCount(): number {
    return 0
  }
}
