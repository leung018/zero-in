import type { ActionService } from '../infra/action'

export class ChromeNewTabService implements ActionService {
  private readonly targetUrl: string

  constructor(targetUrl: string) {
    this.targetUrl = targetUrl
  }

  trigger() {
    chrome.tabs.create({ url: this.targetUrl })
  }
}
