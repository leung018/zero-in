<script setup lang="ts">
import { ref } from 'vue'
import { TimerConfig } from '../domain/pomodoro/config'
import { Duration } from '../domain/pomodoro/duration'
import ContentTemplate from './components/ContentTemplate.vue'

const focusDuration = ref(25)
const shortBreakDuration = ref(5)
const longBreakDuration = ref(15)
const focusSessionsPerCycle = ref(4)
const performCycle = ref(false)

const saveConfig = () => {
  try {
    const config = new TimerConfig({
      focusDuration: new Duration({ minutes: focusDuration.value }),
      shortBreakDuration: performCycle.value
        ? new Duration({ minutes: shortBreakDuration.value })
        : new Duration({ minutes: 0 }),
      longBreakDuration: new Duration({ minutes: longBreakDuration.value }),
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
      <b-form-group label="Focus Duration (minutes)" class="mb-3">
        <b-form-input v-model.number="focusDuration" type="number" min="1" required></b-form-input>
      </b-form-group>
      <b-form-checkbox id="performCycle" v-model="performCycle" class="mb-3">
        Perform Cycle
      </b-form-checkbox>
      <div v-if="performCycle">
        <b-form-group label="Short Break Duration (minutes)" class="mb-3">
          <b-form-input
            v-model.number="shortBreakDuration"
            type="number"
            min="1"
            required
          ></b-form-input>
        </b-form-group>
        <b-form-group label="Focus Sessions Per Cycle" class="mb-3">
          <b-form-input
            v-model.number="focusSessionsPerCycle"
            type="number"
            min="2"
            required
          ></b-form-input>
        </b-form-group>
      </div>
      <b-form-group label="Long Break Duration (minutes)" class="mb-3">
        <b-form-input
          v-model.number="longBreakDuration"
          type="number"
          min="1"
          required
        ></b-form-input>
      </b-form-group>
      <b-button type="submit" variant="primary">Save</b-button>
    </b-form>
  </ContentTemplate>
</template>
