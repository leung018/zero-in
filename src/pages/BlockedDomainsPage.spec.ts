import { describe, expect, it } from 'vitest'

import BlockedDomainsPage from './BlockedDomainsPage.vue'
import {
  BrowsingRulesStorageServiceImpl,
  type BrowsingRulesStorageService
} from '../domain/browsing_rules/storage'
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { BrowsingRules } from '../domain/browsing_rules'
import { FakeWebsiteRedirectService, type WebsiteRedirectService } from '../domain/redirect'

describe('BlockedDomainsPage', () => {
  it('should render blocked domains', async () => {
    const browsingRulesStorageService = BrowsingRulesStorageServiceImpl.createFake()
    await browsingRulesStorageService.save(
      new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })
    )

    const { wrapper } = mountBlockedDomainsPage({ browsingRulesStorageService })
    await flushPromises()

    assertDomainsDisplayed(wrapper, ['example.com', 'facebook.com'])
  })

  it('should able to add new blocked domain', async () => {
    const { wrapper, browsingRulesStorageService } = mountBlockedDomainsPage()

    await addBlockedDomain(wrapper, 'example.com')

    assertDomainsDisplayed(wrapper, ['example.com'])

    expect((await browsingRulesStorageService.get()).blockedDomains).toEqual(['example.com'])

    await addBlockedDomain(wrapper, 'facebook.com')

    assertDomainsDisplayed(wrapper, ['example.com', 'facebook.com'])

    expect((await browsingRulesStorageService.get()).blockedDomains).toEqual([
      'example.com',
      'facebook.com'
    ])
  })

  it('should clear input box after adding new domain', async () => {
    const { wrapper } = mountBlockedDomainsPage()

    await addBlockedDomain(wrapper, 'example.com')

    const inputElement = wrapper.find("[data-test='blocked-domain-input']")
      .element as HTMLInputElement
    expect(inputElement.value).toBe('')
  })

  it('should not save blocked domain when input box is empty', async () => {
    const { wrapper, browsingRulesStorageService } = mountBlockedDomainsPage()

    await addBlockedDomain(wrapper, '')
    await addBlockedDomain(wrapper, '  ')

    assertDomainsDisplayed(wrapper, [])
    expect((await browsingRulesStorageService.get()).blockedDomains).toEqual([])
  })

  it('should save domain in trimmed format', async () => {
    const { wrapper, browsingRulesStorageService } = mountBlockedDomainsPage()

    await addBlockedDomain(wrapper, '  example.com  ')
    assertDomainsDisplayed(wrapper, ['example.com'])

    expect((await browsingRulesStorageService.get()).blockedDomains).toEqual(['example.com'])
  })

  it('should able to remove added domain', async () => {
    const browsingRulesStorageService = BrowsingRulesStorageServiceImpl.createFake()
    await browsingRulesStorageService.save(
      new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })
    )

    const { wrapper } = mountBlockedDomainsPage({ browsingRulesStorageService })
    await flushPromises()

    await removeBlockedDomain(wrapper, 'example.com')

    assertDomainsDisplayed(wrapper, ['facebook.com'])
    expect((await browsingRulesStorageService.get()).blockedDomains).toEqual(['facebook.com'])
  })

  it('should update activated redirect when domain is added', async () => {
    const fakeWebsiteRedirectService = new FakeWebsiteRedirectService()
    const { wrapper } = mountBlockedDomainsPage({
      websiteRedirectService: fakeWebsiteRedirectService,
      targetRedirectUrl: 'https://target.com'
    })

    await addBlockedDomain(wrapper, 'example.com')
    expect(fakeWebsiteRedirectService.getActivatedRedirectRules()).toEqual({
      browsingRules: new BrowsingRules({ blockedDomains: ['example.com'] }),
      targetUrl: 'https://target.com'
    })
  })

  it('should update activated redirect when domain is removed', async () => {
    const fakeWebsiteRedirectService = new FakeWebsiteRedirectService()
    const browsingRulesStorageService = BrowsingRulesStorageServiceImpl.createFake()
    await browsingRulesStorageService.save(
      new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })
    )

    const { wrapper } = mountBlockedDomainsPage({
      browsingRulesStorageService,
      websiteRedirectService: fakeWebsiteRedirectService,
      targetRedirectUrl: 'https://target.com'
    })
    await flushPromises()

    await removeBlockedDomain(wrapper, 'example.com')
    expect(fakeWebsiteRedirectService.getActivatedRedirectRules()).toEqual({
      browsingRules: new BrowsingRules({ blockedDomains: ['facebook.com'] }),
      targetUrl: 'https://target.com'
    })
  })
})

function mountBlockedDomainsPage({
  browsingRulesStorageService = BrowsingRulesStorageServiceImpl.createFake(),
  websiteRedirectService = new FakeWebsiteRedirectService(),
  targetRedirectUrl = 'https://example.com'
}: {
  browsingRulesStorageService?: BrowsingRulesStorageService
  websiteRedirectService?: WebsiteRedirectService
  targetRedirectUrl?: string
} = {}) {
  const wrapper = mount(BlockedDomainsPage, {
    props: { browsingRulesStorageService, websiteRedirectService, targetRedirectUrl }
  })

  return { wrapper, browsingRulesStorageService }
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
  const blockedDomains = wrapper.findAll("[data-test='blocked-domain']")
  expect(blockedDomains.length).toBe(domains.length)

  for (let i = 0; i < domains.length; i++) {
    expect(blockedDomains[i].text()).toBe(domains[i])
  }
}
