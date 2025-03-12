<script setup lang="ts">
import { ChromeCommunicationManager } from './chrome/communication'
import { CloseCurrentTabService } from './chrome/close_current_tab'
import { DailyCutoffTimeStorageService } from './domain/daily_cutoff_time/storage'
import ReminderPage from './pages/ReminderPage.vue'
import { PomodoroRecordStorageService } from './domain/pomodoro/record/storage'
import { SoundService } from './chrome/sound'
</script>

<template>
  <ReminderPage
    :pomodoroRecordStorageService="PomodoroRecordStorageService.create()"
    :dailyCutoffTimeStorageService="DailyCutoffTimeStorageService.create()"
    :port="new ChromeCommunicationManager().clientConnect()"
    :closeCurrentTabService="new CloseCurrentTabService()"
    :soundService="new SoundService()"
    :currentDate="new Date()"
  />
</template>
