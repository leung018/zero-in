import type { DesktopNotifier } from '../desktop_notification'
import iconUrl from '/icon.png'

// Require manual testing
export class BrowserDesktopNotifier implements DesktopNotifier {
  triggerNotification(notificationId: string, buttons: { title: string }[]): void {
    browser.notifications.clear(notificationId).then(() => {
      browser.notifications.create(notificationId, {
        type: 'basic',
        iconUrl,
        title: 'Zero In',
        message: "Time's up!",
        buttons
      })
    })
  }

  clearNotification(notificationId: string): void {
    browser.notifications.clear(notificationId)
  }

  addButtonClickedListener(listener: (notificationId: string, buttonIndex: number) => void): void {
    browser.notifications.onButtonClicked.addListener(listener)
  }
}
