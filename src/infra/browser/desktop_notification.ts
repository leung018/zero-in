import type { DesktopNotifier } from '../desktop_notification'

// Require manual testing
export class ChromeDesktopNotifier implements DesktopNotifier {
  triggerNotification(notificationId: string, buttons: { title: string }[]): void {
    chrome.notifications.clear(notificationId).then(() => {
      chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icon.png'),
        title: 'Zero In',
        message: "Time's up!",
        buttons
      })
    })
  }

  clearNotification(notificationId: string): void {
    chrome.notifications.clear(notificationId)
  }

  addButtonClickedListener(listener: (notificationId: string, buttonIndex: number) => void): void {
    chrome.notifications.onButtonClicked.addListener(listener)
  }
}
