import type { ReminderService } from '../infra/reminder'

export class ChromeNewTabReminderService implements ReminderService {
  private targetUrl: string = chrome.runtime.getURL('reminder.html')

  trigger() {
    chrome.tabs.create({ url: this.targetUrl })
  }
}
