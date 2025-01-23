<script setup lang="ts">
import WeeklySchedulesEditor from './components/WeeklySchedulesEditor.vue'
import { WeeklyScheduleStorageServiceImpl } from './domain/schedules/storage'

const weeklyScheduleStorageService = WeeklyScheduleStorageServiceImpl.create()
</script>

<template>
  <main>
    <WeeklySchedulesEditor :weeklyScheduleStorageService="weeklyScheduleStorageService" />
  </main>
</template>
