<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import type { BlockingTimerIntegrationStorageService } from '../../domain/blocking_timer_integration/storage'
import type { ActionService } from '@/infra/action'

const { blockingTimerIntegrationStorageService, reloadService } = defineProps<{
  blockingTimerIntegrationStorageService: BlockingTimerIntegrationStorageService
  reloadService: ActionService
}>()

const shouldPauseBlockingDuringBreaks = ref(true)

onBeforeMount(async () => {
  const blockingTimerIntegration = await blockingTimerIntegrationStorageService.get()
  shouldPauseBlockingDuringBreaks.value = blockingTimerIntegration.shouldPauseBlockingDuringBreaks
})

async function onClickSave() {
  await blockingTimerIntegrationStorageService.save({
    shouldPauseBlockingDuringBreaks: shouldPauseBlockingDuringBreaks.value
  })
  reloadService.trigger()
}
</script>

<template>
  <BFormCheckbox v-model="shouldPauseBlockingDuringBreaks" data-test="pause-blocking-during-breaks">
    Pause blocking during breaks
  </BFormCheckbox>
  <BButton
    variant="primary"
    @click="onClickSave"
    data-test="save-timer-integration-button"
    class="mt-3"
    >Save</BButton
  >
</template>
