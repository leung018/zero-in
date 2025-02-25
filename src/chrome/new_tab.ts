import type { ActionService } from '../infra/action'

export class ChromeNewTabReminderService implements ActionService {
  private targetUrl: string = chrome.runtime.getURL('reminder.html')

  trigger() {
    chrome.tabs.create({ url: this.targetUrl })
  }
}
