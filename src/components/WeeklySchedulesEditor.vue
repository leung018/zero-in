<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Weekday, WeeklySchedule } from '../domain/schedules'
import type { WeeklyScheduleStorageService } from '../domain/schedules/storage'
import { formatTimeNumber, Time } from '../domain/schedules/time'

const props = defineProps<{
  weeklyScheduleStorageService: WeeklyScheduleStorageService
}>()

const startTimeHour = ref<number>(0)
const startTimeMinute = ref<number>(0)
const endTimeHour = ref<number>(0)
const endTimeMinute = ref<number>(0)

const weekdaySet = ref<Set<Weekday>>(new Set())

const weeklySchedules = ref<WeeklySchedule[]>([])

onMounted(async () => {
  weeklySchedules.value = await props.weeklyScheduleStorageService.getAll()
})

const onClickAdd = async () => {
  const newWeeklySchedule = new WeeklySchedule({
    weekdaySet: weekdaySet.value,
    startTime: new Time(startTimeHour.value, startTimeMinute.value),
    endTime: new Time(endTimeHour.value, endTimeMinute.value)
  })
  await props.weeklyScheduleStorageService.saveAll([newWeeklySchedule])
  weeklySchedules.value = await props.weeklyScheduleStorageService.getAll()
}

const onChangeWeekday = (event: Event) => {
  const target = event.target as HTMLInputElement
  const weekday = Weekday[target.value as keyof typeof Weekday]
  if (target.checked) {
    weekdaySet.value.add(weekday)
  } else {
    // TODO
  }
}

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
            <div v-for="dayName in Weekday" :key="dayName" class="form-check form-check-inline">
              <input
                class="form-check-input"
                type="checkbox"
                :data-test="`check-weekday-${dayName}`"
                :value="Weekday[dayName]"
                @change="onChangeWeekday($event)"
              />
              <label class="form-check-label">{{ dayName }}</label>
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
              data-test="start-time-hour-input"
              v-model="startTimeHour"
            />
            <input
              type="number"
              min="0"
              max="59"
              placeholder="Minute"
              class="form-control w-auto"
              data-test="start-time-minute-input"
              v-model="startTimeMinute"
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
              data-test="end-time-hour-input"
              v-model="endTimeHour"
            />
            <input
              type="number"
              min="0"
              max="59"
              placeholder="Minute"
              class="form-control w-auto"
              data-test="end-time-minute-input"
              v-model="endTimeMinute"
            />
          </div>
        </div>
      </div>
      <button type="button" class="btn btn-primary" data-test="add-button" @click="onClickAdd">
        Add
      </button>
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
