import type { BrowsingRules } from './browsing_rules'

export interface BrowsingControlService {
  setAndActivateNewRules(browsingRules: BrowsingRules): Promise<void>

  deactivateExistingRules(): Promise<void>
}

export class FakeBrowsingControlService implements BrowsingControlService {
  private activatedBrowsingRules: BrowsingRules | null = null

  async setAndActivateNewRules(browsingRules: BrowsingRules): Promise<void> {
    this.activatedBrowsingRules = browsingRules
  }

  getActivatedBrowsingRules() {
    return this.activatedBrowsingRules ? { ...this.activatedBrowsingRules } : null
  }

  async deactivateExistingRules(): Promise<void> {
    this.activatedBrowsingRules = null
  }
}
