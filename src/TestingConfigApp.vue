<script setup lang="ts">
import { ChromeCommunicationManager } from './chrome/communication'
import TestingConfigPage from './pages/TestingConfigPage.vue'
import { PomodoroTimerConfigStorageService } from './domain/pomodoro/config/storage'
</script>

<template>
  <TestingConfigPage
    :timerConfigStorageService="PomodoroTimerConfigStorageService.create()"
    :port="new ChromeCommunicationManager().clientConnect()"
  />
</template>
