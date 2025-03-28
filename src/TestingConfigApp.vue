<script setup lang="ts">
import TestingConfigPage from './pages/TestingConfigPage.vue'
import { PomodoroTimerConfigStorageService } from './domain/pomodoro/config/storage'
</script>

<template>
  <TestingConfigPage :timerConfigStorageService="PomodoroTimerConfigStorageService.create()" />
</template>
