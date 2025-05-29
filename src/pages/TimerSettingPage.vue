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
  loadConfig(timerConfig)
})

function loadConfig(config: TimerConfig) {
  focusDurationMinutes.value = durationToMinutes(config.focusDuration)
  shortBreakDurationMinutes.value = durationToMinutes(config.shortBreakDuration)
  longBreakDurationMinutes.value = durationToMinutes(config.longBreakDuration)
  focusSessionsPerCycle.value = config.focusSessionsPerCycle
  cycleMode.value = config.focusSessionsPerCycle > 1
}

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
    <div class="mb-3">
      <b-button v-b-toggle.timer-tips variant="outline-info" size="sm" class="mb-2">
        <i-ic-baseline-lightbulb class="me-1" /> How it works
      </b-button>
      <b-collapse id="timer-tips">
        <p class="small mb-0 bg-light rounded p-2">
          Research shows that working in short, focused intervals with regular breaks can help
          improve focus. Optimal focus periods typically range from <b>10 to 52 minutes</b>,
          depending on the individual. <br /><br />
          You can experiment to find the time block length that works best for you.
        </p>
      </b-collapse>
    </div>

    <div class="mb-3">
      <h6>Preset configurations</h6>
      <div class="d-flex gap-2">
        <b-button size="sm" variant="outline-secondary" data-test="preset-default">
          <i-ic-baseline-timer class="me-1" /> Default
        </b-button>
        <b-button size="sm" variant="outline-secondary" data-test="preset-52-17">
          <i-ic-baseline-timer class="me-1" /> 52-17
        </b-button>
      </div>
      <p class="small mt-2 mb-2">Changes only take effect after saving.</p>
      <p class="small">
        <span style="cursor: pointer" v-b-toggle.preset-info><u>About these presets</u></span>
      </p>
      <b-collapse id="preset-info" class="mt-2">
        <div class="p-2 bg-light rounded">
          <p class="small mb-1">
            <b>Default:</b> It uses 26-minute focus sessions followed by 5-minute breaks. After four
            sessions, a longer 19-minute break is taken. The focus-to-break ratio matches the 52/17
            method, but each focus session is cut in half.
          </p>
          <p class="small mb-1">
            <b>52/17:</b> Based on productivity research by DeskTime, a 52-minute work session
            followed by a 17-minute break was identified as one of the most effective rhythms for
            maintaining productivity.
          </p>
        </div>
      </b-collapse>
    </div>

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
