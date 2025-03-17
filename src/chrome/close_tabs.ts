import type { ActionService } from '../infra/action'

export class ChromeCloseTabsService implements ActionService {
  private readonly targetUrl: string

  constructor(targetUrl: string) {
    this.targetUrl = targetUrl
  }

  trigger(): void {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab && tab.url && tab.id && tab.url.includes(this.targetUrl)) {
          chrome.tabs.remove(tab.id)
        }
      })
    })
  }
}
