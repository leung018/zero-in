<script setup lang="ts">
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
      <button type="button" class="btn btn-primary">Add Schedule</button>
    </form>
  </div>
</template>
