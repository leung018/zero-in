import type { ActionService } from '../action'

export class BrowserNewTabService implements ActionService {
  // Some of the behaviors may need manual testing

  private readonly targetUrl: string

  constructor(targetUrl: string) {
    this.targetUrl = targetUrl
  }

  async trigger() {
    await browser.tabs.create({ url: this.targetUrl }).then((tab) => {
      if (tab.windowId) {
        return browser.windows.update(tab.windowId, { focused: true })
      }
    })
  }
}
