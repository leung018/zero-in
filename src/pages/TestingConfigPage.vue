<script setup lang="ts">
import config from '../config'
import { PomodoroTimerConfigStorageService } from '../domain/pomodoro/config/storage'
import { defineProps, onBeforeMount, ref } from 'vue'

const { timerConfigStorageService } = defineProps<{
  timerConfigStorageService: PomodoroTimerConfigStorageService
}>()

const timerConfig = ref(config.getDefaultPomodoroTimerConfig())

onBeforeMount(async () => {
  timerConfig.value = await timerConfigStorageService.get()
})
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
          :value="timerConfig.focusDuration.remainingSeconds()"
        ></b-form-input>
      </b-form-group>
      <b-form-group label="Short Break Duration (seconds)">
        <b-form-input
          type="number"
          min="1"
          data-test="short-break-duration"
          :value="timerConfig.shortBreakDuration.remainingSeconds()"
        ></b-form-input>
      </b-form-group>
      <b-form-group label="Long Break Duration (seconds)">
        <b-form-input
          type="number"
          min="1"
          data-test="long-break-duration"
          :value="timerConfig.longBreakDuration.remainingSeconds()"
        ></b-form-input>
      </b-form-group>
      <b-form-group label="Number of Pomodori Per Cycle">
        <b-form-input
          type="number"
          min="1"
          data-test="num-of-pomodori-per-cycle"
          :value="timerConfig.numOfPomodoriPerCycle"
        ></b-form-input>
      </b-form-group>
      <div class="mt-4">
        <b-button variant="danger" type="button" class="me-2" data-test="save-button"
          >Save</b-button
        >
        <b-button variant="success" type="button">Reset to Default</b-button>
      </div>
    </form>
  </div>
</template>
