import { ChromeRedirectService } from '../chrome/redirect'
import { BrowsingRulesStorageServiceImpl } from '../domain/browsing_rules/storage'

declare const chrome: any // FIXME: See other comments related to declare const chrome: any

const browsingRulesStorageService = BrowsingRulesStorageServiceImpl.create()
const websiteRedirectService = new ChromeRedirectService()

// FIXME: Below is to handle the case when the extension is disabled and than enabled again. Without this, the rules for redirection are not activated.
// However, I cannot find a way to test this in the e2e tests and I only use manual testing for this.
browsingRulesStorageService.get().then((browsingRules) => {
  websiteRedirectService.activateRedirect(browsingRules, chrome.runtime.getURL('options.html'))
})
