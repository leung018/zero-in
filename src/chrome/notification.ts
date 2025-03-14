import type { ActionService } from '../infra/action'

export class ChromeNotificationService implements ActionService {
  // Require manual testing

  trigger(): void {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icon.png'),
      title: 'Task Concentrator',
      message: "Time's up!"
    })
  }
}
