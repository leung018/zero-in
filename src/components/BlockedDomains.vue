<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { SiteRulesStorageService } from '@/domain/site_rules_storage'
import { SiteRules } from '../domain/site_rules'
import type { WebsiteRedirectService } from '../chrome/redirect'

const props = defineProps<{
  siteRulesStorageService: SiteRulesStorageService
  websiteRedirectService: WebsiteRedirectService
  targetRedirectUrl: string
}>()
const blockedDomains = ref<ReadonlyArray<string>>([])
const newDomain = ref<string>('')

onMounted(async () => {
  blockedDomains.value = (await props.siteRulesStorageService.get()).blockedDomains
})

async function onClickAdd() {
  const newDomainValue = newDomain.value.trim()
  if (!newDomainValue) return

  const siteRules = new SiteRules({
    blockedDomains: [...blockedDomains.value, newDomainValue]
  })
  await updateSiteRules(siteRules)
  newDomain.value = ''
}

async function onClickRemove(domain: string) {
  const siteRules = new SiteRules({
    blockedDomains: blockedDomains.value.filter((d) => d !== domain)
  })
  await updateSiteRules(siteRules)
}

async function updateSiteRules(siteRules: SiteRules) {
  await props.siteRulesStorageService.save(siteRules)
  await props.websiteRedirectService.activateRedirect(siteRules, props.targetRedirectUrl)
  blockedDomains.value = (await props.siteRulesStorageService.get()).blockedDomains
}
</script>

<template>
  <div class="container mt-4">
    <h1 class="mb-4">Blocked Domains</h1>
    <form class="mb-4">
      <div class="mb-3">
        <input
          v-model="newDomain"
          type="text"
          class="form-control"
          data-test="blocked-domain-input"
          placeholder="Enter your domain"
          required
        />
      </div>
      <button class="btn btn-primary" data-test="add-button" @click="onClickAdd">Add Domain</button>
    </form>
    <ul class="list-group">
      <li
        v-for="domain in blockedDomains"
        :key="domain"
        class="list-group-item d-flex justify-content-between align-items-center"
      >
        <span data-test="blocked-domains">{{ domain }}</span>
        <button
          class="btn text-danger bg-transparent border-0"
          :data-test="`remove-${domain}`"
          @click="onClickRemove(domain)"
        >
          X
        </button>
      </li>
    </ul>
  </div>
</template>
