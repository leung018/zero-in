import { ChromeRedirectService } from '../chrome/redirect'
import { BrowsingRulesStorageServiceImpl } from '../domain/browsing_rules/storage'

declare const chrome: any // FIXME: See other comments related to declare const chrome: any

const browsingRulesStorageService = BrowsingRulesStorageServiceImpl.create()
const websiteRedirectService = new ChromeRedirectService()

browsingRulesStorageService.get().then((browsingRules) => {
  websiteRedirectService.activateRedirect(browsingRules, chrome.runtime.getURL('options.html'))
})
