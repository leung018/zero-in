<script setup lang="ts">
import type { ActionService } from '@/infra/action'
import type { ClientPort } from '@/service_workers/listener'
import { WorkRequestName } from '@/service_workers/request'
import { onBeforeMount, ref } from 'vue'
import type { BlockingTimerIntegrationStorageService } from '../../domain/blocking_timer_integration/storage'

const { blockingTimerIntegrationStorageService, updateSuccessNotifierService, port } = defineProps<{
  blockingTimerIntegrationStorageService: BlockingTimerIntegrationStorageService
  updateSuccessNotifierService: ActionService
  port: ClientPort
}>()

const pauseBlockingDuringBreaks = ref(false)
const pauseBlockingWhenTimerNotRunning = ref(false)

onBeforeMount(async () => {
  const blockingTimerIntegration = await blockingTimerIntegrationStorageService.get()
  pauseBlockingDuringBreaks.value = blockingTimerIntegration.pauseBlockingDuringBreaks
  pauseBlockingWhenTimerNotRunning.value = blockingTimerIntegration.pauseBlockingWhenTimerNotRunning
})

async function onClickSave() {
  await blockingTimerIntegrationStorageService.save({
    pauseBlockingDuringBreaks: pauseBlockingDuringBreaks.value,
    pauseBlockingWhenTimerNotRunning: pauseBlockingWhenTimerNotRunning.value
  })
  port.send({
    name: WorkRequestName.TOGGLE_BROWSING_RULES
  })
  updateSuccessNotifierService.trigger()
}
</script>

<template>
  <BFormCheckbox v-model="pauseBlockingDuringBreaks" data-test="pause-blocking-during-breaks">
    Pause blocking during breaks
  </BFormCheckbox>
  <BFormCheckbox
    v-model="pauseBlockingWhenTimerNotRunning"
    data-test="pause-blocking-when-timer-not-running"
    class="mt-2"
  >
    Pause blocking when timer is not running
  </BFormCheckbox>
  <BButton
    variant="primary"
    @click="onClickSave"
    data-test="save-timer-integration-button"
    class="mt-3"
    >Save</BButton
  >
</template>
