<script setup lang="ts">
import WeeklySchedulesPage from './pages/WeeklySchedulesPage/index.vue'
import { WeeklyScheduleStorageService } from './domain/schedules/storage'
import { MessengerFactory } from './chrome/messenger'
</script>

<template>
  <main>
    <nav class="navbar navbar-expand navbar-light bg-light">
      <span class="navbar-brand ms-2">Options</span>
      <ul class="navbar-nav">
        <li class="nav-item">
          <a class="nav-link" href="#">Schedules</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#">Blocked Domains</a>
        </li>
      </ul>
    </nav>
    <WeeklySchedulesPage
      :weeklyScheduleStorageService="WeeklyScheduleStorageService.create()"
      :sender="MessengerFactory.createMessenger()"
    />
  </main>
</template>
