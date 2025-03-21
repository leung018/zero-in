export class BrowsingRules {
  private _blockedDomains: ReadonlyArray<string>

  constructor({ blockedDomains = [] }: { blockedDomains?: ReadonlyArray<string> } = {}) {
    this._blockedDomains = deduplicated(
      blockedDomains.map((domain) => domain.trim()).filter((domain) => domain !== '')
    )
  }

  get blockedDomains(): ReadonlyArray<string> {
    return this._blockedDomains
  }

  isUrlBlocked(url: string): boolean {
    const urlDomain = new URL(url).hostname
    return this._blockedDomains.some((domain) => urlDomain.includes(domain)) // FIXME: This is not a good way to check the domain. It should be more strict.
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
