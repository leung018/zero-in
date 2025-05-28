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

const pauseBlockingDuringBreaks = ref(true)

onBeforeMount(async () => {
  const blockingTimerIntegration = await blockingTimerIntegrationStorageService.get()
  pauseBlockingDuringBreaks.value = blockingTimerIntegration.pauseBlockingDuringBreaks
})

async function onClickSave() {
  await blockingTimerIntegrationStorageService.save({
    pauseBlockingDuringBreaks: pauseBlockingDuringBreaks.value,
    pauseBlockingWhenTimerIdle: false
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
  <BButton
    variant="primary"
    @click="onClickSave"
    data-test="save-timer-integration-button"
    class="mt-3"
    >Save</BButton
  >
</template>
