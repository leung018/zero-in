import { getDomain } from '../../utils/url'

export class BrowsingRules {
  private _blockedDomains: ReadonlyArray<string>

  constructor({ blockedDomains = [] }: { blockedDomains?: ReadonlyArray<string> } = {}) {
    this._blockedDomains = deduplicated(
      blockedDomains
        .map((domain) => domain.trim())
        .filter((domain) => domain !== '')
        .map(getDomain)
    )
  }

  get blockedDomains(): ReadonlyArray<string> {
    return this._blockedDomains
  }

  isUrlBlocked(url: string): boolean {
    const urlDomain = getDomain(url)
    return this._blockedDomains.some((domain) => domain === urlDomain)
  }

  withNewBlockedDomain(newDomain: string): BrowsingRules {
    return new BrowsingRules({ blockedDomains: [...this._blockedDomains, newDomain] })
  }

  withoutBlockedDomain(domainToRemove: string): BrowsingRules {
    return new BrowsingRules({
      blockedDomains: this._blockedDomains.filter((domain) => domain !== domainToRemove)
    })
  }
}

function deduplicated(inputs: string[]): string[] {
  const set: Set<string> = new Set()
  const results: string[] = []

  inputs.forEach((domain) => {
    if (set.has(domain)) {
      return
    }

    set.add(domain)
    results.push(domain)
  })

  return results
}
