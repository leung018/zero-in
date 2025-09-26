<script setup lang="ts">
import { TimerConfigStorageService } from '@/domain/timer/config/storage'
import { BrowserCommunicationManager } from '@/infra/browser/communication'
import TestingConfigPage from '@/pages/TestingConfigPage.vue'
</script>

<template>
  <TestingConfigPage
    :timerConfigStorageService="TimerConfigStorageService.create()"
    :port="new BrowserCommunicationManager().clientConnect()"
  />
</template>
