import config from '../config'
import { BrowsingRules } from '../domain/browsing_rules'
import type { BrowsingControlService } from '../domain/browsing_control'

export class ChromeBrowsingControlService implements BrowsingControlService {
  private browsingRules: BrowsingRules = new BrowsingRules({})

  private onTabUpdatedListener = (tabId: number, _: unknown, tab: chrome.tabs.Tab) => {
    if (tab.url) {
      const url = new URL(tab.url)

      for (const domain of this.browsingRules.blockedDomains) {
        if (url.hostname.includes(domain)) {
          chrome.tabs.update(tabId, {
            url: config.getBlockedTemplateUrl()
          })
        }
      }
    }
  }

  async setAndActivateNewRules(browsingRules: BrowsingRules): Promise<void> {
    const promises = [
      this.redirectAllActiveTabs(browsingRules),
      this.redirectFutureRequests(browsingRules)
    ]
    await Promise.all(promises)
  }

  deactivateExistingRules = async (): Promise<void> => {
    return chrome.tabs.onUpdated.removeListener(this.onTabUpdatedListener)
  }

  private async redirectFutureRequests(browsingRules: BrowsingRules) {
    this.browsingRules = browsingRules
    return chrome.tabs.onUpdated.addListener(this.onTabUpdatedListener)
  }

  private async redirectAllActiveTabs(browsingRules: BrowsingRules): Promise<void> {
    const tabs = await this.queryAllTabs()
    const promises: Promise<unknown>[] = []
    tabs.forEach((tab) => {
      if (tab && tab.url && tab.id) {
        const url = new URL(tab.url)

        for (const domain of browsingRules.blockedDomains) {
          // FIXME: This is not a good way to check the domain. It should be more strict.
          if (url.hostname.includes(domain)) {
            promises.push(
              chrome.tabs.update(tab.id, {
                url: config.getBlockedTemplateUrl()
              })
            )
          }
        }
      }
    })

    await Promise.all(promises)
  }

  private async queryAllTabs() {
    return chrome.tabs.query({})
  }
}
