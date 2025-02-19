<script setup lang="ts">
import { ChromeCommunicationManager } from './chrome/communication'
import PomodoroTimerPage from './pages/PomodoroTimerPage.vue'
</script>

<template>
  <PomodoroTimerPage :port="new ChromeCommunicationManager().clientConnect()" />
</template>
