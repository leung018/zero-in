import type { DesktopNotifier } from '../desktop-notification'
import iconUrl from '/icon.png'

// Require manual testing
export class BrowserDesktopNotifier implements DesktopNotifier {
  async triggerNotification(notificationId: string, buttons: { title: string }[]): Promise<void> {
    await browser.notifications.clear(notificationId)
    await browser.notifications.create(notificationId, {
      type: 'basic',
      iconUrl,
      title: 'Zero In',
      message: "Time's up!",
      buttons
    })
  }

  clearNotification(notificationId: string): void {
    browser.notifications.clear(notificationId)
  }

  addButtonClickedListener(listener: (notificationId: string, buttonIndex: number) => void): void {
    browser.notifications.onButtonClicked.addListener(listener)
  }
}
