import type { ActionService } from '../infra/action'

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
