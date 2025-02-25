import type { ActionService } from '../infra/action'

// TODO: Currently just test this ReminderService integration manually. Find way to automate this in future.
export class ChromeNewTabReminderService implements ActionService {
  private targetUrl: string = chrome.runtime.getURL('reminder.html')

  trigger() {
    chrome.tabs.create({ url: this.targetUrl })
  }
}
