import config from '../../config'
import { BrowsingRules } from '../../domain/browsing_rules'
import type { BrowsingControlService } from '../browsing_control'

export class ChromeBrowsingControlService implements BrowsingControlService {
  // Use a bit manual testing if you modify this class because e2e test is hard to cover all the bugs perfectly.

  // I use static because so that the call of different instance of this class won't cause bug.
  // But note that only use this class in service worker. If this class is reused within different thread, it will cause unexpected behavior.
  private static browsingRules: BrowsingRules = new BrowsingRules()

  private static onTabUpdatedListener = (tabId: number, _: unknown, tab: Browser.tabs.Tab) => {
    if (tab.url) {
      if (ChromeBrowsingControlService.browsingRules.isUrlBlocked(tab.url)) {
        browser.tabs.update(tabId, {
          url: config.getBlockedTemplateUrl()
        })
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
    return browser.tabs.onUpdated.removeListener(ChromeBrowsingControlService.onTabUpdatedListener)
  }

  private async redirectFutureRequests() {
    if (!browser.tabs.onUpdated.hasListener(ChromeBrowsingControlService.onTabUpdatedListener)) {
      return browser.tabs.onUpdated.addListener(ChromeBrowsingControlService.onTabUpdatedListener)
    }
  }

  private async redirectAllActiveTabs(): Promise<void> {
    const tabs = await this.queryAllTabs()
    const promises: Promise<unknown>[] = []
    tabs.forEach((tab) => {
      if (tab && tab.url && tab.id) {
        if (ChromeBrowsingControlService.browsingRules.isUrlBlocked(tab.url)) {
          promises.push(
            browser.tabs.update(tab.id, {
              url: config.getBlockedTemplateUrl()
            })
          )
        }
      }
    })

    await Promise.all(promises)
  }

  private async queryAllTabs() {
    return browser.tabs.query({})
  }
}
