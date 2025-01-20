import { describe, expect, it } from 'vitest'

import BlockedDomains from '../BlockedDomains.vue'
import {
  SiteRulesStorageServiceImpl,
  type SiteRulesStorageService
} from '../../domain/site_rules_storage'
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { SiteRules } from '../../domain/site_rules'
import type { WebsiteRedirectService } from '../../chrome/redirect'

describe('BlockedDomains', () => {
  it('should render blocked domains', async () => {
    const siteRulesStorageService = SiteRulesStorageServiceImpl.createFake()
    await siteRulesStorageService.save(
      new SiteRules({ blockedDomains: ['example.com', 'facebook.com'] })
    )

    const { wrapper } = mountBlockedDomains({ siteRulesStorageService })
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

    const { wrapper } = mountBlockedDomains({ siteRulesStorageService })
    await flushPromises()

    await removeBlockedDomain(wrapper, 'example.com')

    assertDomainsDisplayed(wrapper, ['facebook.com'])
    expect((await siteRulesStorageService.get()).blockedDomains).toEqual(['facebook.com'])
  })

  it('should update activated redirect when domain is added', async () => {
    const fakeWebsiteRedirectService = new FakeWebsiteRedirectService()
    const { wrapper } = mountBlockedDomains({
      websiteRedirectService: fakeWebsiteRedirectService,
      targetRedirectUrl: 'https://target.com'
    })

    await addBlockedDomain(wrapper, 'example.com')
    expect(fakeWebsiteRedirectService.getActivatedSiteRules()?.blockedDomains).toEqual([
      'example.com'
    ])
    expect(fakeWebsiteRedirectService.getActivatedRedirectUrl()).toBe('https://target.com')
  })

  it('should update activated redirect when domain is removed', async () => {
    const fakeWebsiteRedirectService = new FakeWebsiteRedirectService()
    const siteRulesStorageService = SiteRulesStorageServiceImpl.createFake()
    await siteRulesStorageService.save(
      new SiteRules({ blockedDomains: ['example.com', 'facebook.com'] })
    )

    const { wrapper } = mountBlockedDomains({
      siteRulesStorageService,
      websiteRedirectService: fakeWebsiteRedirectService,
      targetRedirectUrl: 'https://target.com'
    })
    await flushPromises()

    await removeBlockedDomain(wrapper, 'example.com')
    expect(fakeWebsiteRedirectService.getActivatedSiteRules()?.blockedDomains).toEqual([
      'facebook.com'
    ])
    expect(fakeWebsiteRedirectService.getActivatedRedirectUrl()).toBe('https://target.com')
  })
})

function mountBlockedDomains({
  siteRulesStorageService = SiteRulesStorageServiceImpl.createFake(),
  websiteRedirectService = new FakeWebsiteRedirectService(),
  targetRedirectUrl = 'https://example.com'
}: {
  siteRulesStorageService?: SiteRulesStorageService
  websiteRedirectService?: WebsiteRedirectService
  targetRedirectUrl?: string
} = {}) {
  const wrapper = mount(BlockedDomains, {
    props: { siteRulesStorageService, websiteRedirectService, targetRedirectUrl }
  })

  return { wrapper, siteRulesStorageService }
}

class FakeWebsiteRedirectService implements WebsiteRedirectService {
  private activatedSiteRules: SiteRules | null = null
  private activatedRedirectUrl: string | null = null

  async activateRedirect(siteRules: SiteRules, targetUrl: string): Promise<void> {
    this.activatedSiteRules = siteRules
    this.activatedRedirectUrl = targetUrl
  }

  getActivatedSiteRules(): SiteRules | null {
    return this.activatedSiteRules
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
