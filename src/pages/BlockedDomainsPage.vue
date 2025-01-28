<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { BrowsingRulesStorageService } from '@/domain/browsing_rules/storage'
import { BrowsingRules } from '../domain/browsing_rules'
import type { Sender } from '@/domain/messenger'
import { EventName } from '../event'

const { browsingRulesStorageService, sender } = defineProps<{
  sender: Sender
  browsingRulesStorageService: BrowsingRulesStorageService
}>()

const blockedDomains = ref<ReadonlyArray<string>>([])
const newDomain = ref<string>('')

onMounted(async () => {
  blockedDomains.value = (await browsingRulesStorageService.get()).blockedDomains
})

async function onClickAdd() {
  const newDomainValue = newDomain.value.trim()
  if (!newDomainValue) return

  const browsingRules = new BrowsingRules({
    blockedDomains: [...blockedDomains.value, newDomainValue]
  })
  await updateBrowsingRules(browsingRules)
  newDomain.value = ''
}

async function onClickRemove(domain: string) {
  const browsingRules = new BrowsingRules({
    blockedDomains: blockedDomains.value.filter((d) => d !== domain)
  })
  await updateBrowsingRules(browsingRules)
}

async function updateBrowsingRules(browsingRules: BrowsingRules) {
  await browsingRulesStorageService.save(browsingRules)
  await sender.send({ name: EventName.TOGGLE_REDIRECT_RULES })
  blockedDomains.value = browsingRules.blockedDomains
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
      <button class="btn btn-primary" data-test="add-button" @click="onClickAdd">Add</button>
    </form>
    <ul class="list-group">
      <li
        v-for="domain in blockedDomains"
        :key="domain"
        class="list-group-item d-flex justify-content-between align-items-center"
      >
        <span data-test="blocked-domain">{{ domain }}</span>
        <button
          class="btn text-danger bg-transparent border-0"
          :data-test="`remove-${domain}`"
          @click="onClickRemove(domain)"
        >
          <IMdiCrossCircleOutline />
        </button>
      </li>
    </ul>
  </div>
</template>
