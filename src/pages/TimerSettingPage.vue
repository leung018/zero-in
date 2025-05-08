<script setup lang="ts">
import type { ActionService } from '@/infra/action'
import type { ClientPort } from '@/service_workers/listener'
import { onBeforeMount, ref } from 'vue'
import { TimerConfig } from '../domain/timer/config'
import { TimerConfigStorageService } from '../domain/timer/config/storage'
import { Duration } from '../domain/timer/duration'
import { WorkRequestName } from '../service_workers/request'
import ContentTemplate from './components/ContentTemplate.vue'

const { timerConfigStorageService, port, updateSuccessNotifierService } = defineProps<{
  port: ClientPort
  timerConfigStorageService: TimerConfigStorageService
  updateSuccessNotifierService: ActionService
}>()

const focusDurationMinutes = ref(25)
const shortBreakDurationMinutes = ref(5)
const longBreakDurationMinutes = ref(15)
const focusSessionsPerCycle = ref(4)
const cycleMode = ref(false)

function durationToMinutes(d: Duration): number {
  return Math.floor(d.remainingSeconds() / 60)
}

onBeforeMount(async () => {
  const timerConfig = await timerConfigStorageService.get()
  focusDurationMinutes.value = durationToMinutes(timerConfig.focusDuration)
  shortBreakDurationMinutes.value = durationToMinutes(timerConfig.shortBreakDuration)
  longBreakDurationMinutes.value = durationToMinutes(timerConfig.longBreakDuration)
  focusSessionsPerCycle.value = timerConfig.focusSessionsPerCycle

  cycleMode.value = timerConfig.focusSessionsPerCycle > 1
})

const onClickSave = async () => {
  const originalConfig = await timerConfigStorageService.get()

  const config = new TimerConfig({
    focusDuration: new Duration({ minutes: focusDurationMinutes.value }),
    shortBreakDuration: cycleMode.value
      ? new Duration({ minutes: shortBreakDurationMinutes.value })
      : originalConfig.shortBreakDuration,
    longBreakDuration: new Duration({ minutes: longBreakDurationMinutes.value }),
    focusSessionsPerCycle: cycleMode.value ? focusSessionsPerCycle.value : 1
  })

  await timerConfigStorageService.save(config)

  port.send({
    name: WorkRequestName.RESET_TIMER_CONFIG
  })

  updateSuccessNotifierService.trigger()
}
</script>

<template>
  <ContentTemplate title="Timer Setting">
    <b-form @submit.prevent>
      <b-form-group label="Focus Session Duration (minutes)" class="mb-3">
        <b-form-input
          v-model.number="focusDurationMinutes"
          type="number"
          min="1"
          required
          data-test="focus-duration"
        ></b-form-input>
      </b-form-group>
      <b-form-checkbox v-model="cycleMode" class="mb-3" data-test="perform-cycle">
        Cycle Mode
      </b-form-checkbox>
      <p v-if="!cycleMode" class="small">
        If disabled, it will alternate between focus sessions and breaks.
      </p>
      <p v-if="cycleMode" class="small">
        If enabled, it will repeat the set focus sessions and short breaks, end with a long break,
        then continue from the beginning.
      </p>
      <div v-show="cycleMode">
        <b-form-group label="Short Break Duration (minutes)" class="mb-3">
          <b-form-input
            v-model.number="shortBreakDurationMinutes"
            type="number"
            min="1"
            required
            data-test="short-break-duration"
          ></b-form-input>
        </b-form-group>
        <b-form-group label="Focus Sessions Per Cycle" class="mb-3">
          <b-form-input
            v-model.number="focusSessionsPerCycle"
            type="number"
            min="2"
            required
            data-test="focus-sessions-per-cycle"
          ></b-form-input>
        </b-form-group>
      </div>
      <b-form-group
        :label="cycleMode ? 'Long Break Duration (minutes)' : 'Break Duration (minutes)'"
        class="mb-3"
      >
        <b-form-input
          v-model.number="longBreakDurationMinutes"
          type="number"
          min="1"
          required
          data-test="long-break-duration"
        ></b-form-input>
      </b-form-group>
      <b-button type="submit" variant="primary" data-test="save-button" @click="onClickSave"
        >Save</b-button
      >
      <p class="small mt-2"><b>* Caution: After saving, the timer will be reset</b></p>
    </b-form>
  </ContentTemplate>
</template>
