<script setup lang="ts">
import { DailyResetTimeStorageService } from '@/domain/daily-reset-time/storage'
import { BrowserCommunicationManager } from '@/infra/browser/communication'
import { BrowserSoundService } from '@/infra/browser/sound'
import ReminderPage from '@/pages/ReminderPage.vue'
import { newFocusSessionRecordsStorageService } from '../../domain/timer/record/storage'
</script>

<template>
  <ReminderPage
    :focusSessionRecordsStorageService="newFocusSessionRecordsStorageService()"
    :dailyResetTimeStorageService="DailyResetTimeStorageService.create()"
    :port="new BrowserCommunicationManager().clientConnect()"
    :soundService="new BrowserSoundService()"
  />
</template>
