export type Badge = {
  text: string
  color: BadgeColor
}

export type BadgeColor = {
  textColor: string
  backgroundColor: string
}
export interface BadgeDisplayService {
  displayBadge(badge: Badge): void
  clearBadge(): void
}

export class FakeBadgeDisplayService implements BadgeDisplayService {
  private displayedBadge: Badge | null = null

  displayBadge(badgeInfo: Badge) {
    this.displayedBadge = badgeInfo
  }

  clearBadge() {
    this.displayedBadge = null
  }

  getDisplayedBadge() {
    return this.displayedBadge
  }
}
