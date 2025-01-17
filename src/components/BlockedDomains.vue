<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { SiteRulesService } from '@/domain/site_rules_service'
import { SiteRules } from '../domain/site_rules'

const props = defineProps<{
  siteRulesService: SiteRulesService
}>()
const blockedDomains = ref<ReadonlyArray<string>>([])
const newDomain = ref<string>('')

onMounted(async () => {
  blockedDomains.value = (await props.siteRulesService.get()).blockedDomains
})

async function onClickAdd() {
  const newDomainValue = newDomain.value.trim()
  if (!newDomainValue) return

  await props.siteRulesService.save(
    new SiteRules({
      blockedDomains: [...blockedDomains.value, newDomainValue]
    })
  )

  blockedDomains.value = (await props.siteRulesService.get()).blockedDomains
  newDomain.value = ''
}

async function onClickRemove(domain: string) {
  await props.siteRulesService.save(
    new SiteRules({
      blockedDomains: blockedDomains.value.filter((d) => d !== domain)
    })
  )

  blockedDomains.value = (await props.siteRulesService.get()).blockedDomains
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
