<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import type { BrowsingRulesStorageService } from '@/domain/browsing_rules/storage'
import { BrowsingRules } from '@/domain/browsing_rules'
import { WorkRequestName } from '@/service_workers/request'
import type { ClientPort } from '@/service_workers/listener'

const { browsingRulesStorageService, port } = defineProps<{
  port: ClientPort
  browsingRulesStorageService: BrowsingRulesStorageService
}>()

const browsingRules = ref<BrowsingRules>(new BrowsingRules())
const newDomain = ref<string>('')

onBeforeMount(async () => {
  browsingRules.value = await browsingRulesStorageService.get()
})

async function onClickAdd() {
  const newDomainValue = newDomain.value.trim()
  if (!newDomainValue) return

  const newBrowsingRules = browsingRules.value.withNewBlockedDomain(newDomainValue)
  await updateBrowsingRules(newBrowsingRules)
  newDomain.value = ''
}

async function onClickRemove(domain: string) {
  const newBrowsingRules = browsingRules.value.withRemovedBlockedDomain(domain)
  await updateBrowsingRules(newBrowsingRules)
}

async function updateBrowsingRules(newBrowsingRules: BrowsingRules) {
  await browsingRulesStorageService.save(newBrowsingRules)
  await port.send({ name: WorkRequestName.TOGGLE_BROWSING_RULES })
  browsingRules.value = newBrowsingRules
}
</script>

<template>
  <form @submit.prevent>
    <div class="mb-3">
      <input
        v-model="newDomain"
        type="text"
        class="form-control"
        data-test="blocked-domain-input"
        placeholder="Enter your domain"
        required
      />
      <p class="mt-1">
        <small>
          Enter the websites that distract you the most, e.g. "facebook.com", "instagram.com".
        </small>
      </p>
    </div>
    <BButton variant="primary" data-test="add-domain-button" @click="onClickAdd" type="submit"
      >Add</BButton
    >
  </form>
  <ul class="list-group mt-4" v-if="browsingRules.blockedDomains.length > 0">
    <li
      v-for="domain in browsingRules.blockedDomains"
      :key="domain"
      class="list-group-item d-flex justify-content-between align-items-center"
    >
      <span data-test="blocked-domain">{{ domain }}</span>
      <BButton
        class="bg-transparent text-danger border-0"
        :data-test="`remove-${domain}`"
        @click="onClickRemove(domain)"
      >
        X
      </BButton>
    </li>
  </ul>
</template>
