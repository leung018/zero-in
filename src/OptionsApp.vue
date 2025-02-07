<script setup lang="ts">
import WeeklySchedulesPage from './pages/WeeklySchedulesPage/index.vue'
import { WeeklyScheduleStorageServiceImpl } from './domain/schedules/storage'
import { MessengerFactory } from './chrome/messenger'
</script>

<template>
  <main>
    <WeeklySchedulesPage
      :weeklyScheduleStorageService="WeeklyScheduleStorageServiceImpl.create()"
      :messenger="MessengerFactory.createMessenger()"
    />
  </main>
</template>
