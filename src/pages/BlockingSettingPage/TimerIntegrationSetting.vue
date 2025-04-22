<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import type { BlockingTimerIntegrationStorageService } from '../../domain/blocking_timer_integration/storage'

const { blockingTimerIntegrationStorageService } = defineProps<{
  blockingTimerIntegrationStorageService: BlockingTimerIntegrationStorageService
}>()

const shouldPauseBlockingDuringBreaks = ref(true)

onBeforeMount(async () => {
  const blockingTimerIntegration = await blockingTimerIntegrationStorageService.get()
  shouldPauseBlockingDuringBreaks.value = blockingTimerIntegration.shouldPauseBlockingDuringBreaks
})
</script>

<template>
  <BFormCheckbox v-model="shouldPauseBlockingDuringBreaks" data-test="pause-blocking-during-breaks">
    Pause blocking during breaks
  </BFormCheckbox>
</template>
