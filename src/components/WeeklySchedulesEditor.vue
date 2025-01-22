<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Weekday, WeeklySchedule } from '../domain/schedules'
import type { WeeklyScheduleStorageService } from '../domain/schedules/storage'
import { formatTimeNumber, Time } from '../domain/schedules/time'

const props = defineProps<{
  weeklyScheduleStorageService: WeeklyScheduleStorageService
}>()

const weekdays = Object.values(Weekday).filter((value) => typeof value === 'string')

const weeklySchedules = ref<WeeklySchedule[]>([])

onMounted(async () => {
  weeklySchedules.value = await props.weeklyScheduleStorageService.getAll()
})

const formatTime = (Time: Time) => {
  return `${formatTimeNumber(Time.hour)}:${formatTimeNumber(Time.minute)}`
}
</script>

<template>
  <div class="container">
    <h1 class="mb-4 mt-4">Schedules</h1>
    <form>
      <div class="mb-4">
        <div class="form-group">
          <label>Select Weekdays:</label>
          <div class="d-flex flex-wrap">
            <div v-for="(day, index) in weekdays" :key="index" class="form-check form-check-inline">
              <input
                class="form-check-input"
                type="checkbox"
                :id="'weekday-' + index"
                :value="day"
              />
              <label class="form-check-label" :for="'weekday-' + index">{{ day }}</label>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Start Time:</label>
          <div class="d-flex">
            <input
              type="number"
              min="0"
              max="23"
              placeholder="Hour"
              class="form-control w-auto me-2"
            />
            <input
              type="number"
              min="0"
              max="59"
              placeholder="Minute"
              class="form-control w-auto"
            />
          </div>
        </div>

        <div class="form-group">
          <label>End Time:</label>
          <div class="d-flex">
            <input
              type="number"
              min="0"
              max="23"
              placeholder="Hour"
              class="form-control w-auto me-2"
            />
            <input
              type="number"
              min="0"
              max="59"
              placeholder="Minute"
              class="form-control w-auto"
            />
          </div>
        </div>
      </div>
      <button type="button" class="btn btn-primary">Add</button>
    </form>
    <div class="mt-4">
      <h3>Saved</h3>
      <ul class="list-group">
        <li
          v-for="(schedule, index) in weeklySchedules"
          :key="index"
          class="list-group-item d-flex justify-content-between align-items-center"
          data-test="weekly-schedule"
        >
          <div>
            {{
              Array.from(schedule.weekdaySet)
                .map((day) => Weekday[day])
                .join(', ')
            }}
            <br />
            {{ formatTime(schedule.startTime) }} - {{ formatTime(schedule.endTime) }}
          </div>
          <button class="btn text-danger bg-transparent border-0">X</button>
        </li>
      </ul>
    </div>
  </div>
</template>
