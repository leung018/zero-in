<script setup lang="ts">
import { BrowserCommunicationManager } from '@/infra/browser/communication'
import TestingConfigPage from '@/pages/TestingConfigPage.vue'
import { newTimerConfigStorageService } from '../../domain/timer/config/storage-factory'
</script>

<template>
  <TestingConfigPage
    :timerConfigStorageService="newTimerConfigStorageService()"
    :port="new BrowserCommunicationManager().clientConnect()"
  />
</template>
