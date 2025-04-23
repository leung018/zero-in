<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import type { BlockingTimerIntegrationStorageService } from '../../domain/blocking_timer_integration/storage'
import type { ActionService } from '@/infra/action'
import type { Port } from '@/infra/communication'
import { WorkRequestName, type WorkRequest } from '@/service_workers/request'
import type { WorkResponse } from '@/service_workers/response'

const { blockingTimerIntegrationStorageService, reloadService, port } = defineProps<{
  blockingTimerIntegrationStorageService: BlockingTimerIntegrationStorageService
  reloadService: ActionService
  port: Port<WorkRequest, WorkResponse>
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
  port.send({
    name: WorkRequestName.TOGGLE_BROWSING_RULES
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
