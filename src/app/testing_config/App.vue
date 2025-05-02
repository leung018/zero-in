<script setup lang="ts">
import { ChromeCommunicationManager } from '@/infra/chrome/communication'
import TestingConfigPage from '@/pages/TestingConfigPage.vue'
import { TimerConfigStorageService } from '@/domain/timer/config/storage'
</script>

<template>
  <TestingConfigPage
    :timerConfigStorageService="TimerConfigStorageService.create()"
    :port="new ChromeCommunicationManager().clientConnect()"
  />
</template>
