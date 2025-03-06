import { BrowsingRules } from '.'

type SerializedBrowsingRules = {
  blockedDomains: ReadonlyArray<string>
}

export function serializeBrowsingRules(browsingRules: BrowsingRules): SerializedBrowsingRules {
  return {
    blockedDomains: browsingRules.blockedDomains
  }
}

export function deserializeBrowsingRules(data: SerializedBrowsingRules): BrowsingRules {
  return new BrowsingRules(data)
}
