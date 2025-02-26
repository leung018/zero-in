import type { BadgeDisplayService, Badge } from '../infra/badge'

export class ChromeBadgeDisplayService implements BadgeDisplayService {
  displayBadge(badge: Badge) {
    chrome.action.setBadgeText({ text: badge.text })
    chrome.action.setBadgeBackgroundColor({ color: badge.backgroundColor })
    chrome.action.setBadgeTextColor({ color: badge.textColor })
  }

  clearBadge() {
    chrome.action.setBadgeText({ text: '' })
  }
}
