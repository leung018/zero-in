import { describe, expect, it } from 'vitest'

import BlockedDomains from '../BlockedDomains.vue'
import { InMemorySiteRulesService, type SiteRulesService } from '../../domain/site_rules_service'
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'

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

  it('should able to add new blocked domain', async () => {
    const { wrapper, siteRulesService } = mountBlockedDomains()

    await addBlockedDomain(wrapper, 'example.com')

    let blockedDomains = wrapper.findAll("[data-test='blocked-domains']")
    expect(blockedDomains.length).toBe(1)
    expect(blockedDomains[0].text()).toBe('example.com')

    expect((await siteRulesService.getSiteRules()).blockedDomains).toEqual(['example.com'])

    await addBlockedDomain(wrapper, 'facebook.com')

    blockedDomains = wrapper.findAll("[data-test='blocked-domains']")
    expect(blockedDomains.length).toBe(2)

    expect(blockedDomains[0].text()).toBe('example.com')
    expect(blockedDomains[1].text()).toBe('facebook.com')

    expect((await siteRulesService.getSiteRules()).blockedDomains).toEqual([
      'example.com',
      'facebook.com'
    ])
  })
})

function mountBlockedDomains(siteRulesService: SiteRulesService = new InMemorySiteRulesService()) {
  const wrapper = mount(BlockedDomains, {
    props: { siteRulesService }
  })

  return { wrapper, siteRulesService }
}

async function addBlockedDomain(wrapper: VueWrapper, domain: string) {
  const inputElement = wrapper.find("[data-test='blocked-domain-input']")
  await inputElement.setValue(domain)

  const addButton = wrapper.find("[data-test='add-button']")
  await addButton.trigger('click')
}
