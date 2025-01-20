import type { SiteRules } from '../domain/site_rules'

declare const chrome: any // FIXME: Find a way to type this properly and also fix the type hint related to it.

export interface WebsiteRedirectService {
  activateRedirect(siteRules: SiteRules, targetUrl: string): Promise<void>
}

export class WebsiteRedirectServiceImpl implements WebsiteRedirectService {
  async activateRedirect(siteRules: SiteRules, targetUrl: string): Promise<void> {
    await this.redirectFutureRequests(siteRules, targetUrl)
    await this.redirectAllActiveTabs(siteRules, targetUrl)
  }

  private async redirectFutureRequests(siteRules: SiteRules, targetUrl: string): Promise<void> {
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
        requestDomains: siteRules.blockedDomains,
        resourceTypes: ['main_frame']
      }
    }

    return chrome.declarativeNetRequest.updateDynamicRules(
      {
        addRules: siteRules.blockedDomains.length > 0 ? [rule] : undefined,
        removeRuleIds: [1]
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError)
        }
      }
    )
  }

  private async redirectAllActiveTabs(siteRules: SiteRules, targetUrl: string): Promise<void> {
    const tabs: any[] = await this.queryAllTabs()
    tabs.forEach((tab) => {
      if (tab && tab.url) {
        const url = new URL(tab.url)

        for (const domain of siteRules.blockedDomains) {
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
