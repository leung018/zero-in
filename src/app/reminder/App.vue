<script setup lang="ts">
import { DailyResetTimeStorageService } from '@/domain/daily_reset_time/storage'
import { FocusSessionRecordStorageService } from '@/domain/timer/record/storage'
import { ChromeCommunicationManager } from '@/infra/browser/communication'
import { ChromeSoundService } from '@/infra/browser/sound'
import { CurrentDateService } from '@/infra/current_date'
import ReminderPage from '@/pages/ReminderPage.vue'
</script>

<template>
  <ReminderPage
    :focusSessionRecordStorageService="FocusSessionRecordStorageService.create()"
    :dailyResetTimeStorageService="DailyResetTimeStorageService.create()"
    :port="new ChromeCommunicationManager().clientConnect()"
    :soundService="new ChromeSoundService()"
    :currentDateService="CurrentDateService.create()"
  />
</template>
