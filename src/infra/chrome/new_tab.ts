import type { ActionService } from '../action'

export class ChromeNewTabService implements ActionService {
  private readonly targetUrl: string

  constructor(targetUrl: string) {
    this.targetUrl = targetUrl
  }

  trigger() {
    chrome.tabs.create({ url: this.targetUrl })
  }
}
