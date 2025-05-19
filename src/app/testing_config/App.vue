<script setup lang="ts">
import { TimerConfigStorageService } from '@/domain/timer/config/storage'
import { ChromeCommunicationManager } from '@/infra/chrome/communication'
import TestingConfigPage from '@/pages/TestingConfigPage.vue'
</script>

<template>
  <TestingConfigPage
    :timerConfigStorageService="TimerConfigStorageService.create()"
    :port="new ChromeCommunicationManager().clientConnect()"
  />
</template>
