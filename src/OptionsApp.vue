<script setup lang="ts">
import WeeklySchedulesPage from './pages/WeeklySchedulesPage/index.vue'
import { WeeklyScheduleStorageService } from './domain/schedules/storage'
import { MessengerFactory } from './chrome/messenger'
</script>

<template>
  <main>
    <WeeklySchedulesPage
      :weeklyScheduleStorageService="WeeklyScheduleStorageService.create()"
      :sender="MessengerFactory.createMessenger()"
    />
  </main>
</template>
