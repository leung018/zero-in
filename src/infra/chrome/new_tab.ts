import type { ActionService } from '../action'

export class ChromeNewTabService implements ActionService {
  // Some of the behaviors may need manual testing

  private readonly targetUrl: string

  constructor(targetUrl: string) {
    this.targetUrl = targetUrl
  }

  trigger() {
    chrome.tabs.create({ url: this.targetUrl }).then((tab) => {
      if (tab.windowId) {
        chrome.windows.update(tab.windowId, { focused: true })
      }
    })
  }
}
