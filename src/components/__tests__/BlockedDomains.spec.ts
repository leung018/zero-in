import { describe, expect, it } from 'vitest'

import BlockedDomains from '../BlockedDomains.vue'
import {
  BrowsingRulesStorageServiceImpl,
  type BrowsingRulesStorageService
} from '../../domain/browsing_rules_storage'
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { BrowsingRules } from '../../domain/browsing_rules'
import type { WebsiteRedirectService } from '../../chrome/redirect'

describe('BlockedDomains', () => {
  it('should render blocked domains', async () => {
    const browsingRulesStorageService = BrowsingRulesStorageServiceImpl.createFake()
    await browsingRulesStorageService.save(
      new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })
    )

    const { wrapper } = mountBlockedDomains({ browsingRulesStorageService })
    await flushPromises()

    assertDomainsDisplayed(wrapper, ['example.com', 'facebook.com'])
  })

  it('should able to add new blocked domain', async () => {
    const { wrapper, browsingRulesStorageService } = mountBlockedDomains()

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
    const { wrapper } = mountBlockedDomains()

    await addBlockedDomain(wrapper, 'example.com')

    const inputElement = wrapper.find("[data-test='blocked-domain-input']")
      .element as HTMLInputElement
    expect(inputElement.value).toBe('')
  })

  it('should not save blocked domain when input box is empty', async () => {
    const { wrapper, browsingRulesStorageService } = mountBlockedDomains()

    await addBlockedDomain(wrapper, '')
    await addBlockedDomain(wrapper, '  ')

    assertDomainsDisplayed(wrapper, [])
    expect((await browsingRulesStorageService.get()).blockedDomains).toEqual([])
  })

  it('should save domain in trimmed format', async () => {
    const { wrapper, browsingRulesStorageService } = mountBlockedDomains()

    await addBlockedDomain(wrapper, '  example.com  ')
    assertDomainsDisplayed(wrapper, ['example.com'])

    expect((await browsingRulesStorageService.get()).blockedDomains).toEqual(['example.com'])
  })

  it('should able to remove added domain', async () => {
    const browsingRulesStorageService = BrowsingRulesStorageServiceImpl.createFake()
    await browsingRulesStorageService.save(
      new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })
    )

    const { wrapper } = mountBlockedDomains({ browsingRulesStorageService })
    await flushPromises()

    await removeBlockedDomain(wrapper, 'example.com')

    assertDomainsDisplayed(wrapper, ['facebook.com'])
    expect((await browsingRulesStorageService.get()).blockedDomains).toEqual(['facebook.com'])
  })

  it('should update activated redirect when domain is added', async () => {
    const fakeWebsiteRedirectService = new FakeWebsiteRedirectService()
    const { wrapper } = mountBlockedDomains({
      websiteRedirectService: fakeWebsiteRedirectService,
      targetRedirectUrl: 'https://target.com'
    })

    await addBlockedDomain(wrapper, 'example.com')
    expect(fakeWebsiteRedirectService.getActivatedBrowsingRules()?.blockedDomains).toEqual([
      'example.com'
    ])
    expect(fakeWebsiteRedirectService.getActivatedRedirectUrl()).toBe('https://target.com')
  })

  it('should update activated redirect when domain is removed', async () => {
    const fakeWebsiteRedirectService = new FakeWebsiteRedirectService()
    const browsingRulesStorageService = BrowsingRulesStorageServiceImpl.createFake()
    await browsingRulesStorageService.save(
      new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })
    )

    const { wrapper } = mountBlockedDomains({
      browsingRulesStorageService,
      websiteRedirectService: fakeWebsiteRedirectService,
      targetRedirectUrl: 'https://target.com'
    })
    await flushPromises()

    await removeBlockedDomain(wrapper, 'example.com')
    expect(fakeWebsiteRedirectService.getActivatedBrowsingRules()?.blockedDomains).toEqual([
      'facebook.com'
    ])
    expect(fakeWebsiteRedirectService.getActivatedRedirectUrl()).toBe('https://target.com')
  })
})

function mountBlockedDomains({
  browsingRulesStorageService = BrowsingRulesStorageServiceImpl.createFake(),
  websiteRedirectService = new FakeWebsiteRedirectService(),
  targetRedirectUrl = 'https://example.com'
}: {
  browsingRulesStorageService?: BrowsingRulesStorageService
  websiteRedirectService?: WebsiteRedirectService
  targetRedirectUrl?: string
} = {}) {
  const wrapper = mount(BlockedDomains, {
    props: { browsingRulesStorageService, websiteRedirectService, targetRedirectUrl }
  })

  return { wrapper, browsingRulesStorageService }
}

class FakeWebsiteRedirectService implements WebsiteRedirectService {
  private activatedBrowsingRules: BrowsingRules | null = null
  private activatedRedirectUrl: string | null = null

  async activateRedirect(browsingRules: BrowsingRules, targetUrl: string): Promise<void> {
    this.activatedBrowsingRules = browsingRules
    this.activatedRedirectUrl = targetUrl
  }

  getActivatedBrowsingRules(): BrowsingRules | null {
    return this.activatedBrowsingRules
  }

  getActivatedRedirectUrl(): string | null {
    return this.activatedRedirectUrl
  }
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
