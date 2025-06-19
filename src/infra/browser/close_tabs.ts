import type { ActionService } from '../action'

export class BrowserCloseTabsService implements ActionService {
  private readonly targetUrl: string

  constructor(targetUrl: string) {
    this.targetUrl = targetUrl
  }

  trigger(): void {
    browser.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab && tab.url && tab.id && tab.url.includes(this.targetUrl)) {
          browser.tabs.remove(tab.id)
        }
      })
    })
  }
}
