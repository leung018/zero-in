<script setup lang="ts">
import { ChromeCommunicationManager } from './chrome/communication'
import ReminderPage from './pages/ReminderPage.vue'
</script>

<template>
  <ReminderPage :port="new ChromeCommunicationManager().clientConnect()" />
</template>
