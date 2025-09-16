<script setup lang="ts">
import type { ActionService } from '@/infra/action'
import LoadingWrapper from '@/pages/components/LoadingWrapper.vue'
import type { ClientPort } from '@/service_workers/listener'
import { WorkRequestName } from '@/service_workers/request'
import { ref } from 'vue'
import type { TimerBasedBlockingRulesStorageService } from '../../domain/timer_based_blocking/storage'

const { timerBasedBlockingRulesStorageService, updateSuccessNotifierService, port } = defineProps<{
  timerBasedBlockingRulesStorageService: TimerBasedBlockingRulesStorageService
  updateSuccessNotifierService: ActionService
  port: ClientPort
}>()

const pauseBlockingDuringBreaks = ref(false)
const pauseBlockingWhenTimerNotRunning = ref(false)
const isLoading = ref(true)

timerBasedBlockingRulesStorageService.get().then((config) => {
  pauseBlockingDuringBreaks.value = config.pauseBlockingDuringBreaks
  pauseBlockingWhenTimerNotRunning.value = config.pauseBlockingWhenTimerNotRunning
  isLoading.value = false
})

async function onClickSave() {
  await timerBasedBlockingRulesStorageService.save({
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
  <LoadingWrapper :isLoading="isLoading">
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
  </LoadingWrapper>
</template>
