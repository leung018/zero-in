<script setup lang="ts">
import config from './config'
import { Connector } from './chrome/connector'
import PomodoroTimerPage from './pages/PomodoroTimerPage.vue'
</script>

<template>
  <PomodoroTimerPage
    :focus-duration="config.getFocusDuration()"
    :port="Connector.create().connect()"
  />
</template>
