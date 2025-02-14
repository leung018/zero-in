<script setup lang="ts">
import config from './config'
import { Timer } from './domain/pomodoro/timer'
import PomodoroTimerPage from './pages/PomodoroTimerPage.vue'
</script>

<template>
  <PomodoroTimerPage :focus-duration="config.getFocusDuration()" :timer="Timer.create()" />
</template>
