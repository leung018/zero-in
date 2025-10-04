import type { ActionService } from '../action'

export class BrowserCloseTabsService implements ActionService {
  private readonly targetUrl: string

  constructor(targetUrl: string) {
    this.targetUrl = targetUrl
  }

  async trigger(): Promise<void> {
    const tabs = await browser.tabs.query({})
    const tabsRemovePromises: Promise<unknown>[] = []
    tabs.forEach((tab) => {
      if (tab && tab.url && tab.id && tab.url.includes(this.targetUrl)) {
        tabsRemovePromises.push(browser.tabs.remove(tab.id))
      }
    })
    await Promise.all(tabsRemovePromises)
  }
}
