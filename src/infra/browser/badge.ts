import type { Badge, BadgeDisplayService } from '../badge'

export class ChromeBadgeDisplayService implements BadgeDisplayService {
  // Hard to e2e test this class. Use a bit manual testing.

  displayBadge(badge: Badge) {
    browser.action.setBadgeText({ text: badge.text })
    browser.action.setBadgeBackgroundColor({ color: badge.color.backgroundColor })
    browser.action.setBadgeTextColor({ color: badge.color.textColor })
  }

  clearBadge() {
    browser.action.setBadgeText({ text: '' })
  }
}
