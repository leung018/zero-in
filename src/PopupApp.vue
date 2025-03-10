<script setup lang="ts">
import { ChromeCommunicationManager } from './chrome/communication'
import config from './config'
import PomodoroTimerPage from './pages/PomodoroTimerPage.vue'
</script>

<template>
  <PomodoroTimerPage
    :port="new ChromeCommunicationManager().clientConnect()"
    :num-of-focus-per-cycle="config.getPomodoroTimerConfig().numOfPomodoriPerCycle"
  />
</template>
