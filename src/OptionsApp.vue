<script setup lang="ts">
import WeeklySchedulesPage from './pages/WeeklySchedulesPage/index.vue'
import { WeeklyScheduleStorageServiceImpl } from './domain/schedules/storage'
import { ChromeMessenger } from './chrome/messenger'
</script>

<template>
  <main>
    <WeeklySchedulesPage
      :weeklyScheduleStorageService="WeeklyScheduleStorageServiceImpl.create()"
      :chromeMessenger="ChromeMessenger.create()"
    />
  </main>
</template>
