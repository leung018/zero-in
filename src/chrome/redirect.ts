import type { BrowsingRules } from '../domain/browsing_rules'

declare const chrome: any // FIXME: Find a way to type this properly and also fix the type hint related to it.

export interface WebsiteRedirectService {
  activateRedirect(browsingRules: BrowsingRules, targetUrl: string): Promise<void>
}

export class ChromeRedirectService implements WebsiteRedirectService {
  async activateRedirect(browsingRules: BrowsingRules, targetUrl: string): Promise<void> {
    await this.redirectFutureRequests(browsingRules, targetUrl)
    await this.redirectAllActiveTabs(browsingRules, targetUrl)
  }

  private async redirectFutureRequests(
    browsingRules: BrowsingRules,
    targetUrl: string
  ): Promise<void> {
    const rule = {
      id: 1,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: {
          url: targetUrl
        }
      },
      condition: {
        requestDomains: browsingRules.blockedDomains,
        resourceTypes: ['main_frame']
      }
    }

    return chrome.declarativeNetRequest.updateDynamicRules(
      {
        addRules: browsingRules.blockedDomains.length > 0 ? [rule] : undefined,
        removeRuleIds: [1]
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError)
        }
      }
    )
  }

  private async redirectAllActiveTabs(
    browsingRules: BrowsingRules,
    targetUrl: string
  ): Promise<void> {
    const tabs: any[] = await this.queryAllTabs()
    tabs.forEach((tab) => {
      if (tab && tab.url) {
        const url = new URL(tab.url)

        for (const domain of browsingRules.blockedDomains) {
          // FIXME: This is not a good way to check the domain. It should be more strict.
          if (url.hostname.includes(domain)) {
            chrome.tabs.update(tab.id, {
              url: targetUrl
            })
          }
        }
      }
    })
  }

  private async queryAllTabs() {
    return chrome.tabs.query({})
  }
}
