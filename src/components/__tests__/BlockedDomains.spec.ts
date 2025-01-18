import { describe, expect, it } from 'vitest'

import BlockedDomains from '../BlockedDomains.vue'
import {
  SiteRulesStorageServiceImpl,
  type SiteRulesStorageService
} from '../../domain/site_rules_storage'
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { SiteRules } from '../../domain/site_rules'

describe('BlockedDomains', () => {
  it('should render blocked domains', async () => {
    const siteRulesStorageService = SiteRulesStorageServiceImpl.createFake()
    await siteRulesStorageService.save(
      new SiteRules({ blockedDomains: ['example.com', 'facebook.com'] })
    )

    const { wrapper } = mountBlockedDomains(siteRulesStorageService)
    await flushPromises()

    assertDomainsDisplayed(wrapper, ['example.com', 'facebook.com'])
  })

  it('should able to add new blocked domain', async () => {
    const { wrapper, siteRulesStorageService } = mountBlockedDomains()

    await addBlockedDomain(wrapper, 'example.com')

    assertDomainsDisplayed(wrapper, ['example.com'])

    expect((await siteRulesStorageService.get()).blockedDomains).toEqual(['example.com'])

    await addBlockedDomain(wrapper, 'facebook.com')

    assertDomainsDisplayed(wrapper, ['example.com', 'facebook.com'])

    expect((await siteRulesStorageService.get()).blockedDomains).toEqual([
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
    const { wrapper, siteRulesStorageService } = mountBlockedDomains()

    await addBlockedDomain(wrapper, '')
    await addBlockedDomain(wrapper, '  ')

    assertDomainsDisplayed(wrapper, [])
    expect((await siteRulesStorageService.get()).blockedDomains).toEqual([])
  })

  it('should save domain in trimmed format', async () => {
    const { wrapper, siteRulesStorageService } = mountBlockedDomains()

    await addBlockedDomain(wrapper, '  example.com  ')
    assertDomainsDisplayed(wrapper, ['example.com'])

    expect((await siteRulesStorageService.get()).blockedDomains).toEqual(['example.com'])
  })

  it('should able to remove added domain', async () => {
    const siteRulesStorageService = SiteRulesStorageServiceImpl.createFake()
    await siteRulesStorageService.save(
      new SiteRules({ blockedDomains: ['example.com', 'facebook.com'] })
    )

    const { wrapper } = mountBlockedDomains(siteRulesStorageService)
    await flushPromises()

    await removeBlockedDomain(wrapper, 'example.com')

    assertDomainsDisplayed(wrapper, ['facebook.com'])
    expect((await siteRulesStorageService.get()).blockedDomains).toEqual(['facebook.com'])
  })
})

function mountBlockedDomains(
  siteRulesStorageService: SiteRulesStorageService = SiteRulesStorageServiceImpl.createFake()
) {
  const wrapper = mount(BlockedDomains, {
    props: { siteRulesStorageService }
  })

  return { wrapper, siteRulesStorageService }
}

async function addBlockedDomain(wrapper: VueWrapper, domain: string) {
  const inputElement = wrapper.find("[data-test='blocked-domain-input']")
  await inputElement.setValue(domain)

  const addButton = wrapper.find("[data-test='add-button']")
  addButton.trigger('click')
  await flushPromises()
}

async function removeBlockedDomain(wrapper: VueWrapper, domain: string) {
  const removeButton = wrapper.find(`[data-test='remove-${domain}']`)
  await removeButton.trigger('click')
  await flushPromises()
}

function assertDomainsDisplayed(wrapper: VueWrapper, domains: string[]) {
  const blockedDomains = wrapper.findAll("[data-test='blocked-domains']")
  expect(blockedDomains.length).toBe(domains.length)

  for (let i = 0; i < domains.length; i++) {
    expect(blockedDomains[i].text()).toBe(domains[i])
  }
}
