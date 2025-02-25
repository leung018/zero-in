<script setup lang="ts">
import { ChromeCommunicationManager } from './chrome/communication'
import { CloseCurrentTabService } from './chrome/close_current_tab'
import ReminderPage from './pages/ReminderPage.vue'
</script>

<template>
  <ReminderPage
    :port="new ChromeCommunicationManager().clientConnect()"
    :closeCurrentTabService="new CloseCurrentTabService()"
  />
</template>
