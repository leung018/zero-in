import type { Badge, BadgeDisplayService } from '../badge'

export class ChromeBadgeDisplayService implements BadgeDisplayService {
  // Hard to e2e test this class. Use a bit manual testing.

  displayBadge(badge: Badge) {
    chrome.action.setBadgeText({ text: badge.text })
    chrome.action.setBadgeBackgroundColor({ color: badge.color.backgroundColor })
    chrome.action.setBadgeTextColor({ color: badge.color.textColor })
  }

  clearBadge() {
    chrome.action.setBadgeText({ text: '' })
  }
}
