<script setup lang="ts">
import { ChromeCommunicationManager } from './chrome/communication'
import config from './config'
import PomodoroTimerPage from './pages/PomodoroTimerPage.vue'
</script>

<template>
  <PomodoroTimerPage
    :focus-duration="config.getFocusDuration()"
    :port="new ChromeCommunicationManager().clientConnect()"
  />
</template>
