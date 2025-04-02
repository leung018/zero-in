<script setup lang="ts">
import { onBeforeMount, ref } from 'vue'
import { TimerConfig } from '../domain/pomodoro/config'
import { Duration } from '../domain/pomodoro/duration'
import ContentTemplate from './components/ContentTemplate.vue'
import { TimerConfigStorageService } from '../domain/pomodoro/config/storage'

const { timerConfigStorageService } = defineProps<{
  timerConfigStorageService: TimerConfigStorageService
}>()

const focusDurationMinutes = ref(25)
const shortBreakDurationMinutes = ref(5)
const longBreakDurationMinutes = ref(15)
const focusSessionsPerCycle = ref(4)
const performCycle = ref(false)

function durationToMinutes(d: Duration): number {
  return Math.floor(d.remainingSeconds() / 60)
}

onBeforeMount(async () => {
  const timerConfig = await timerConfigStorageService.get()
  focusDurationMinutes.value = durationToMinutes(timerConfig.focusDuration)
  shortBreakDurationMinutes.value = durationToMinutes(timerConfig.shortBreakDuration)
  longBreakDurationMinutes.value = durationToMinutes(timerConfig.longBreakDuration)
  focusSessionsPerCycle.value = timerConfig.focusSessionsPerCycle

  performCycle.value = timerConfig.focusSessionsPerCycle > 1
})

const saveConfig = () => {
  try {
    const config = new TimerConfig({
      focusDuration: new Duration({ minutes: focusDurationMinutes.value }),
      shortBreakDuration: new Duration({ minutes: shortBreakDurationMinutes.value }),
      longBreakDuration: new Duration({ minutes: longBreakDurationMinutes.value }),
      focusSessionsPerCycle: performCycle.value ? focusSessionsPerCycle.value : 0
    })
    console.log('Saved Config:', config)
    alert('Configuration saved successfully!')
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message)
    }
  }
}
</script>

<template>
  <ContentTemplate title="Timer Setting">
    <b-form @submit.prevent="saveConfig">
      <b-form-group label="Focus Session Duration (minutes)" class="mb-3">
        <b-form-input
          v-model.number="focusDurationMinutes"
          type="number"
          min="1"
          required
          data-test="focus-duration"
        ></b-form-input>
      </b-form-group>
      <b-form-checkbox
        id="performCycle"
        v-model="performCycle"
        class="mb-3"
        data-test="perform-cycle"
      >
        Perform Cycle
      </b-form-checkbox>
      <p v-if="!performCycle" class="small">
        If disabled, the timer will switch between focus sessions and break
      </p>
      <p v-if="performCycle" class="small">
        If enabled, the timer will repeat a set number of focus sessions, each followed by a short
        break. After completing the cycle, a long break will occur
      </p>
      <div v-if="performCycle">
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
        :label="performCycle ? 'Long Break Duration (minutes)' : 'Break Duration (minutes)'"
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
      <b-button type="submit" variant="primary">Save</b-button>
    </b-form>
  </ContentTemplate>
</template>
