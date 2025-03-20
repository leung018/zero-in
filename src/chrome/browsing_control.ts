import config from '../config'
import { BrowsingRules } from '../domain/browsing_rules'
import type { BrowsingControlService } from '../domain/browsing_control'

export class ChromeBrowsingControlService implements BrowsingControlService {
  private static browsingRules: BrowsingRules = new BrowsingRules({})

  private static onTabUpdatedListener = (tabId: number, _: unknown, tab: chrome.tabs.Tab) => {
    if (tab.url) {
      const url = new URL(tab.url)

      for (const domain of ChromeBrowsingControlService.browsingRules.blockedDomains) {
        if (url.hostname.includes(domain)) {
          chrome.tabs.update(tabId, {
            url: config.getBlockedTemplateUrl()
          })
        }
      }
    }
  }

  async setAndActivateNewRules(browsingRules: BrowsingRules): Promise<void> {
    ChromeBrowsingControlService.browsingRules = browsingRules
    const promises = [this.redirectAllActiveTabs(), this.redirectFutureRequests()]
    await Promise.all(promises)
  }

  async deactivateExistingRules(): Promise<void> {
    ChromeBrowsingControlService.browsingRules = new BrowsingRules({})
    return chrome.tabs.onUpdated.removeListener(ChromeBrowsingControlService.onTabUpdatedListener)
  }

  private async redirectFutureRequests() {
    if (!chrome.tabs.onUpdated.hasListener(ChromeBrowsingControlService.onTabUpdatedListener)) {
      return chrome.tabs.onUpdated.addListener(ChromeBrowsingControlService.onTabUpdatedListener)
    }
  }

  private async redirectAllActiveTabs(): Promise<void> {
    const tabs = await this.queryAllTabs()
    const promises: Promise<unknown>[] = []
    tabs.forEach((tab) => {
      if (tab && tab.url && tab.id) {
        const url = new URL(tab.url)

        for (const domain of ChromeBrowsingControlService.browsingRules.blockedDomains) {
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
