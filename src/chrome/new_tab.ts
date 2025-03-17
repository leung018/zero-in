import type { ActionService } from '../infra/action'

// TODO: Currently just test this integration manually. Find way to automate this in future.
export class ChromeNewTabService implements ActionService {
  private readonly targetUrl: string

  constructor(targetUrl: string) {
    this.targetUrl = targetUrl
  }

  trigger() {
    chrome.tabs.create({ url: this.targetUrl })
  }
}
