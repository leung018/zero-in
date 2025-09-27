<script setup lang="ts">
import { DailyResetTimeStorageService } from '@/domain/daily_reset_time/storage'
import { FocusSessionRecordsStorageService } from '@/domain/timer/record/storage'
import { BrowserCommunicationManager } from '@/infra/browser/communication'
import { BrowserSoundService } from '@/infra/browser/sound'
import ReminderPage from '@/pages/ReminderPage.vue'
</script>

<template>
  <ReminderPage
    :focusSessionRecordsStorageService="FocusSessionRecordsStorageService.create()"
    :dailyResetTimeStorageService="DailyResetTimeStorageService.create()"
    :port="new BrowserCommunicationManager().clientConnect()"
    :soundService="new BrowserSoundService()"
  />
</template>
