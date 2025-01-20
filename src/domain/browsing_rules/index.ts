export class BrowsingRules {
  private _blockedDomains: ReadonlyArray<string>

  constructor({ blockedDomains = [] }: { blockedDomains?: ReadonlyArray<string> } = {}) {
    this._blockedDomains = deduplicated(blockedDomains.map((domain) => domain.trim()))
  }

  public get blockedDomains(): ReadonlyArray<string> {
    return this._blockedDomains
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
