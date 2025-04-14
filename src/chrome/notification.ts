import type { ActionService } from '../infra/action'

// Require manual testing
export class ChromeDesktopNotificationService implements ActionService {
  trigger(): void {
    chrome.notifications.create('time-up', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icon.png'),
      title: 'Task Concentrator',
      message: "Time's up!"
    })
  }
}
