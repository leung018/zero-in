<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { SiteRulesService } from '@/domain/site_rules_service'

const props = defineProps<{
  siteRulesService: SiteRulesService
}>()
const blockedDomains = ref<string[]>([])
const newDomain = ref<string>('')

onMounted(async () => {
  blockedDomains.value = (await props.siteRulesService.getSiteRules()).blockedDomains
})

async function onClickAdd() {
  const newDomainValue = newDomain.value.trim()
  if (!newDomainValue) return

  await props.siteRulesService.save({
    blockedDomains: [...blockedDomains.value, newDomainValue]
  })

  blockedDomains.value = (await props.siteRulesService.getSiteRules()).blockedDomains
  newDomain.value = ''
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
        class="list-group-item"
        data-test="blocked-domains"
      >
        {{ domain }}
      </li>
    </ul>
  </div>
</template>
