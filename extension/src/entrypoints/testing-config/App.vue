<script setup lang="ts">
import { BrowserCommunicationManager } from '@/infra/browser/communication'
import { realTimerConfigStorageService } from '@/infra/storage/factories/real'
import TestingConfigPage from '@/pages/TestingConfigPage.vue'
</script>

<template>
  <TestingConfigPage
    :timerConfigStorageService="realTimerConfigStorageService()"
    :port="new BrowserCommunicationManager().clientConnect()"
  />
</template>
