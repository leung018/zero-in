import { describe, expect, it } from 'vitest'

import BlockedDomains from '../BlockedDomains.vue'
import { InMemorySiteRulesService, type SiteRulesService } from '../../domain/site_rules_service'
import { flushPromises, mount } from '@vue/test-utils'

describe('BlockedDomains', () => {
  it('should render blocked domains', async () => {
    const siteRulesService = new InMemorySiteRulesService()
    await siteRulesService.save({ blockedDomains: ['example.com', 'facebook.com'] })

    const { wrapper } = mountBlockedDomains(siteRulesService)
    await flushPromises()

    const blockedDomains = wrapper.findAll("[data-test='blocked-domains']")
    expect(blockedDomains.length).toBe(2)

    expect(blockedDomains[0].text()).toBe('example.com')
    expect(blockedDomains[1].text()).toBe('facebook.com')
  })
})

function mountBlockedDomains(siteRulesService: SiteRulesService = new InMemorySiteRulesService()) {
  const wrapper = mount(BlockedDomains, {
    props: { siteRulesService }
  })

  return { wrapper }
}
