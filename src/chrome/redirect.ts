import config from '../config'
import type { BrowsingRules } from '../domain/browsing_rules'
import type { WebsiteRedirectService } from '../domain/redirect'

const REDIRECT_RULE_ID = 1

export class ChromeRedirectService implements WebsiteRedirectService {
  async activateRedirect(browsingRules: BrowsingRules): Promise<void> {
    const targetUrl = config.getBlockedTemplateUrl()
    const promises = [
      this.redirectAllActiveTabs(browsingRules, targetUrl),
      this.redirectFutureRequests(browsingRules, targetUrl)
    ]
    await Promise.all(promises)
  }

  async deactivateRedirect(): Promise<void> {
    return chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [REDIRECT_RULE_ID]
    })
  }

  private async redirectFutureRequests(
    browsingRules: BrowsingRules,
    targetUrl: string
  ): Promise<void> {
    const rule: chrome.declarativeNetRequest.Rule = {
      id: REDIRECT_RULE_ID,
      priority: 1,
      action: {
        type: 'redirect',
        redirect: {
          url: targetUrl
        }
      },
      condition: {
        requestDomains: [...browsingRules.blockedDomains],
        resourceTypes: ['main_frame']
      }
    }

    return chrome.declarativeNetRequest.updateDynamicRules({
      addRules: browsingRules.blockedDomains.length > 0 ? [rule] : undefined,
      removeRuleIds: [1]
    })
  }

  private async redirectAllActiveTabs(
    browsingRules: BrowsingRules,
    targetUrl: string
  ): Promise<void> {
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
                url: targetUrl
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
