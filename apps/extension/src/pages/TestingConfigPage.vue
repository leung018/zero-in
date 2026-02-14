<script setup lang="ts">
import type { ClientPort } from '@/service-workers/listener'
import { Duration } from '@zero-in/shared/domain/timer/duration'
import { ref } from 'vue'
import { TimerConfig } from '../domain/timer/config'
import { TimerConfigStorageService } from '../domain/timer/config/storage'
import { newResetTimerConfigRequest } from '../service-workers/request'

const { timerConfigStorageService, port } = defineProps<{
  port: ClientPort
  timerConfigStorageService: TimerConfigStorageService
}>()

const focusDurationSeconds = ref(0)
const shortBreakDurationSeconds = ref(0)
const longBreakDurationSeconds = ref(0)
const focusSessionsPerCycle = ref(0)

timerConfigStorageService.get().then((config) => {
  focusDurationSeconds.value = config.focusDuration.remainingSeconds()
  shortBreakDurationSeconds.value = config.shortBreakDuration.remainingSeconds()
  longBreakDurationSeconds.value = config.longBreakDuration.remainingSeconds()
  focusSessionsPerCycle.value = config.focusSessionsPerCycle
})

const onClickSave = async () => {
  const timerConfig = new TimerConfig({
    focusDuration: new Duration({ seconds: focusDurationSeconds.value }),
    shortBreakDuration: new Duration({ seconds: shortBreakDurationSeconds.value }),
    longBreakDuration: new Duration({ seconds: longBreakDurationSeconds.value }),
    focusSessionsPerCycle: focusSessionsPerCycle.value
  })
  await port.send(newResetTimerConfigRequest(timerConfig))
}
</script>

<template>
  <div class="container">
    <h1 class="mt-5 mb-4">
      Warning: For development testing only. If you accidentally navigate to this page, please close
      this tab
    </h1>
    <form>
      <b-form-group label="Focus Duration (seconds)">
        <b-form-input
          type="number"
          min="1"
          data-test="focus-duration"
          v-model.number="focusDurationSeconds"
        ></b-form-input>
      </b-form-group>
      <b-form-group label="Short Break Duration (seconds)">
        <b-form-input
          type="number"
          min="1"
          data-test="short-break-duration"
          v-model.number="shortBreakDurationSeconds"
        ></b-form-input>
      </b-form-group>
      <b-form-group label="Long Break Duration (seconds)">
        <b-form-input
          type="number"
          min="1"
          data-test="long-break-duration"
          v-model.number="longBreakDurationSeconds"
        ></b-form-input>
      </b-form-group>
      <b-form-group label="Focus Sessions Per Cycle">
        <b-form-input
          type="number"
          min="0"
          data-test="focus-sessions-per-cycle"
          v-model.number="focusSessionsPerCycle"
        ></b-form-input>
      </b-form-group>
      <div class="mt-4">
        <b-button
          variant="danger"
          type="button"
          class="me-2"
          data-test="testing-config-save-button"
          @click="onClickSave"
        >
          Save
        </b-button>
      </div>
    </form>
  </div>
</template>
