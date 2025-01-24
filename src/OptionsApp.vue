<script setup lang="ts">
import WeeklySchedulesPage from './pages/WeeklySchedulesPage/index.vue'
import { WeeklyScheduleStorageServiceImpl } from './domain/schedules/storage'

const weeklyScheduleStorageService = WeeklyScheduleStorageServiceImpl.create()
</script>

<template>
  <main>
    <WeeklySchedulesPage :weeklyScheduleStorageService="weeklyScheduleStorageService" />
  </main>
</template>
