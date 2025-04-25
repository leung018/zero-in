import { describe, expect, it } from 'vitest'

import BlockedDomainsEditor from './BlockedDomainsEditor.vue'
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { BrowsingRules } from '@/domain/browsing_rules'
import { setUpListener } from '@/test_utils/listener'
import { dataTestSelector } from '../../test_utils/selector'
import { assertSelectorInputValue } from '../../test_utils/assert'

describe('BlockedDomainsEditor', () => {
  it('should render blocked domains', async () => {
    const { wrapper } = await mountBlockedDomainsEditor({
      browsingRules: new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })
    })

    assertDomainsDisplayed(wrapper, ['example.com', 'facebook.com'])
  })

  it('should able to add new blocked domain', async () => {
    const { wrapper, browsingRulesStorageService } = await mountBlockedDomainsEditor({
      browsingRules: new BrowsingRules()
    })

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
    const { wrapper } = await mountBlockedDomainsEditor()

    await addBlockedDomain(wrapper, 'example.com')

    assertSelectorInputValue(wrapper, dataTestSelector('blocked-domain-input'), '')
  })

  it('should not save blocked domain when input box is empty', async () => {
    const { wrapper, browsingRulesStorageService } = await mountBlockedDomainsEditor({
      browsingRules: new BrowsingRules()
    })

    await addBlockedDomain(wrapper, '')
    await addBlockedDomain(wrapper, '  ')

    assertDomainsDisplayed(wrapper, [])
    expect((await browsingRulesStorageService.get()).blockedDomains).toEqual([])
  })

  it('should save domain in trimmed format', async () => {
    const { wrapper, browsingRulesStorageService } = await mountBlockedDomainsEditor({
      browsingRules: new BrowsingRules()
    })

    await addBlockedDomain(wrapper, '  example.com  ')
    assertDomainsDisplayed(wrapper, ['example.com'])

    expect((await browsingRulesStorageService.get()).blockedDomains).toEqual(['example.com'])
  })

  it('should able to remove added domain', async () => {
    const { wrapper, browsingRulesStorageService } = await mountBlockedDomainsEditor({
      browsingRules: new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })
    })

    await removeBlockedDomain(wrapper, 'example.com')

    assertDomainsDisplayed(wrapper, ['facebook.com'])
    expect((await browsingRulesStorageService.get()).blockedDomains).toEqual(['facebook.com'])
  })

  it('should update activated redirect when domain is added', async () => {
    const { browsingControlService, wrapper } = await mountBlockedDomainsEditor({
      browsingRules: new BrowsingRules()
    })

    await addBlockedDomain(wrapper, 'example.com')
    expect(browsingControlService.getActivatedBrowsingRules()).toEqual(
      new BrowsingRules({ blockedDomains: ['example.com'] })
    )
  })

  it('should update activated redirect when domain is removed', async () => {
    const { wrapper, browsingControlService } = await mountBlockedDomainsEditor({
      browsingRules: new BrowsingRules({ blockedDomains: ['example.com', 'facebook.com'] })
    })

    await removeBlockedDomain(wrapper, 'example.com')
    expect(browsingControlService.getActivatedBrowsingRules()).toEqual(
      new BrowsingRules({ blockedDomains: ['facebook.com'] })
    )
  })
})

async function mountBlockedDomainsEditor({
  browsingRules = new BrowsingRules({ blockedDomains: ['abc.com'] })
} = {}) {
  const { browsingRulesStorageService, communicationManager, browsingControlService, listener } =
    await setUpListener()
  await browsingRulesStorageService.save(browsingRules)

  await listener.start()

  const wrapper = mount(BlockedDomainsEditor, {
    props: { browsingRulesStorageService, port: communicationManager.clientConnect() }
  })
  await flushPromises()
  return { wrapper, browsingRulesStorageService, browsingControlService }
}

async function addBlockedDomain(wrapper: VueWrapper, domain: string) {
  const inputElement = wrapper.find(dataTestSelector('blocked-domain-input'))
  await inputElement.setValue(domain)

  const addButton = wrapper.find(dataTestSelector('add-domain-button'))
  addButton.trigger('click')
  await flushPromises()
}

async function removeBlockedDomain(wrapper: VueWrapper, domain: string) {
  const removeButton = wrapper.find(`[data-test='remove-${domain}']`)
  await removeButton.trigger('click')
  await flushPromises()
}

function assertDomainsDisplayed(wrapper: VueWrapper, domains: string[]) {
  const blockedDomains = wrapper.findAll(dataTestSelector('blocked-domain'))
  expect(blockedDomains.length).toBe(domains.length)

  for (let i = 0; i < domains.length; i++) {
    expect(blockedDomains[i].text()).toBe(domains[i])
  }
}
