<script setup lang="ts">
import { BrowserCommunicationManager } from '@/infra/browser/communication'
import { BrowserSoundService } from '@/infra/browser/sound'
import {
  realDailyResetTimeStorageService,
  realFocusSessionRecordsStorageService
} from '@/infra/storage/factories/real'
import ReminderPage from '@/pages/ReminderPage.vue'
</script>

<template>
  <ReminderPage
    :focusSessionRecordsStorageService="realFocusSessionRecordsStorageService()"
    :dailyResetTimeStorageService="realDailyResetTimeStorageService()"
    :port="new BrowserCommunicationManager().clientConnect()"
    :soundService="new BrowserSoundService()"
  />
</template>
