<script setup lang="ts">
import { ref } from 'vue'

enum Weekday {
  Sun = 0,
  Mon,
  Tue,
  Wed,
  Thu,
  Fri,
  Sat
}

type WeeklySchedule = {
  weekdaySet: Set<Weekday>
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
}

const weekdays = Object.values(Weekday).filter((value) => typeof value === 'string')

const weeklySchedules = ref<WeeklySchedule[]>([
  {
    weekdaySet: new Set([Weekday.Mon, Weekday.Wed, Weekday.Fri]),
    startHour: 10,
    startMinute: 59,
    endHour: 17,
    endMinute: 59
  },
  {
    weekdaySet: new Set([Weekday.Tue, Weekday.Thu]),
    startHour: 10,
    startMinute: 59,
    endHour: 18,
    endMinute: 59
  }
])
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
        >
          <div>
            {{
              Array.from(schedule.weekdaySet)
                .map((day) => Weekday[day])
                .join(', ')
            }}
            <br />
            {{ schedule.startHour }}:{{ schedule.startMinute }} - {{ schedule.endHour }}:{{
              schedule.endMinute
            }}
          </div>
          <button class="btn text-danger bg-transparent border-0">X</button>
        </li>
      </ul>
    </div>
  </div>
</template>
