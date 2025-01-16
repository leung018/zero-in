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

    assertDomainsDisplayed(wrapper, ['example.com', 'facebook.com'])
  })

  it('should able to add new blocked domain', async () => {
    const { wrapper, siteRulesService } = mountBlockedDomains()

    await addBlockedDomain(wrapper, 'example.com')

    assertDomainsDisplayed(wrapper, ['example.com'])

    expect((await siteRulesService.getSiteRules()).blockedDomains).toEqual(['example.com'])

    await addBlockedDomain(wrapper, 'facebook.com')

    assertDomainsDisplayed(wrapper, ['example.com', 'facebook.com'])

    expect((await siteRulesService.getSiteRules()).blockedDomains).toEqual([
      'example.com',
      'facebook.com'
    ])
  })

  it('should clear input box after adding new domain', async () => {
    const { wrapper } = mountBlockedDomains()

    await addBlockedDomain(wrapper, 'example.com')

    const inputElement = wrapper.find("[data-test='blocked-domain-input']")
      .element as HTMLInputElement
    expect(inputElement.value).toBe('')
  })

  it('should not save blocked domain when input box is empty', async () => {
    const { wrapper } = mountBlockedDomains()

    await addBlockedDomain(wrapper, '')
    assertDomainsDisplayed(wrapper, [])

    await addBlockedDomain(wrapper, '  ')
    assertDomainsDisplayed(wrapper, [])
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

function assertDomainsDisplayed(wrapper: VueWrapper, domains: string[]) {
  const blockedDomains = wrapper.findAll("[data-test='blocked-domains']")
  expect(blockedDomains.length).toBe(domains.length)

  for (let i = 0; i < domains.length; i++) {
    expect(blockedDomains[i].text()).toBe(domains[i])
  }
}
