<script setup lang="ts">
import type { ClientPort } from '@/service_workers/listener'
import { defineProps, onBeforeMount, ref } from 'vue'
import { TimerConfig } from '../domain/timer/config'
import { TimerConfigStorageService } from '../domain/timer/config/storage'
import { Duration } from '../domain/timer/duration'
import { WorkRequestName } from '../service_workers/request'

const { timerConfigStorageService, port } = defineProps<{
  port: ClientPort
  timerConfigStorageService: TimerConfigStorageService
}>()

const focusDurationSeconds = ref(0)
const shortBreakDurationSeconds = ref(0)
const longBreakDurationSeconds = ref(0)
const focusSessionsPerCycle = ref(0)

onBeforeMount(async () => {
  const timerConfig = await timerConfigStorageService.get()

  focusDurationSeconds.value = timerConfig.focusDuration.remainingSeconds()
  shortBreakDurationSeconds.value = timerConfig.shortBreakDuration.remainingSeconds()
  longBreakDurationSeconds.value = timerConfig.longBreakDuration.remainingSeconds()
  focusSessionsPerCycle.value = timerConfig.focusSessionsPerCycle
})

const onClickSave = async () => {
  const timerConfig = new TimerConfig({
    focusDuration: new Duration({ seconds: focusDurationSeconds.value }),
    shortBreakDuration: new Duration({ seconds: shortBreakDurationSeconds.value }),
    longBreakDuration: new Duration({ seconds: longBreakDurationSeconds.value }),
    focusSessionsPerCycle: focusSessionsPerCycle.value
  })
  await timerConfigStorageService.save(timerConfig)
  port.send({
    name: WorkRequestName.RESET_TIMER_CONFIG
  })
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
          data-test="num-of-pomodori-per-cycle"
          v-model.number="focusSessionsPerCycle"
        ></b-form-input>
      </b-form-group>
      <div class="mt-4">
        <b-button
          variant="danger"
          type="button"
          class="me-2"
          data-test="save-button"
          @click="onClickSave"
        >
          Save
        </b-button>
      </div>
    </form>
  </div>
</template>
