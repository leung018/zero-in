<script setup lang="ts">
import { DailyResetTimeStorageService } from '@/domain/daily_reset_time/storage'
import { FocusSessionRecordStorageService } from '@/domain/timer/record/storage'
import { ChromeCommunicationManager } from '@/infra/chrome/communication'
import { SoundService } from '@/infra/chrome/sound'
import { CurrentDateService } from '@/infra/current_date'
import ReminderPage from '@/pages/ReminderPage.vue'
</script>

<template>
  <ReminderPage
    :focusSessionRecordStorageService="FocusSessionRecordStorageService.create()"
    :dailyResetTimeStorageService="DailyResetTimeStorageService.create()"
    :port="new ChromeCommunicationManager().clientConnect()"
    :soundService="new SoundService()"
    :currentDateService="CurrentDateService.create()"
  />
</template>
