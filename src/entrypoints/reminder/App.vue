<script setup lang="ts">
import { DailyResetTimeStorageService } from '@/domain/daily_reset_time/storage'
import { FocusSessionRecordStorageService } from '@/domain/timer/record/storage'
import { BrowserCommunicationManager } from '@/infra/browser/communication'
import { BrowserSoundService } from '@/infra/browser/sound'
import { CurrentDateService } from '@/infra/current_date'
import ReminderPage from '@/pages/ReminderPage.vue'
</script>

<template>
  <ReminderPage
    :focusSessionRecordStorageService="FocusSessionRecordStorageService.create()"
    :dailyResetTimeStorageService="DailyResetTimeStorageService.create()"
    :port="new BrowserCommunicationManager().clientConnect()"
    :soundService="new BrowserSoundService()"
    :currentDateService="CurrentDateService.create()"
  />
</template>
