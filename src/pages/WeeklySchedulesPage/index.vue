<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Weekday, WeeklySchedule } from '../../domain/schedules'
import type { WeeklyScheduleStorageService } from '../../domain/schedules/storage'
import { formatTimeNumber, Time } from '../../domain/schedules/time'
import TimeInput from './TimeInput.vue'
import WeekdaysSelector from './WeekdaysSelector.vue'

const props = defineProps<{
  weeklyScheduleStorageService: WeeklyScheduleStorageService
}>()

const newStartTime = ref<Time>(new Time(0, 0))
const newEndTime = ref<Time>(new Time(0, 0))

const newWeekdaySet = ref<Set<Weekday>>(new Set())

const weeklySchedules = ref<WeeklySchedule[]>([])

const errorMessage = ref<string | null>(null)

onMounted(async () => {
  weeklySchedules.value = await props.weeklyScheduleStorageService.getAll()
})

const onClickAdd = async () => {
  if (newWeekdaySet.value.size === 0) {
    errorMessage.value = 'Please select weekdays'
    return
  }
  if (!newStartTime.value.isBefore(newEndTime.value)) {
    errorMessage.value = 'Start time must be before end time'
    return
  }

  const newWeeklySchedule = new WeeklySchedule({
    weekdaySet: newWeekdaySet.value,
    startTime: newStartTime.value,
    endTime: newEndTime.value
  })
  await updateWeeklySchedules([...weeklySchedules.value, newWeeklySchedule])

  errorMessage.value = null
  newStartTime.value = new Time(0, 0)
  newEndTime.value = new Time(0, 0)
  newWeekdaySet.value.clear()
}

const onClickRemove = async (index: number) => {
  const newWeeklySchedules = weeklySchedules.value.filter((_, i) => i !== index)
  await updateWeeklySchedules(newWeeklySchedules)
}

const updateWeeklySchedules = async (newWeeklySchedules: WeeklySchedule[]) => {
  await props.weeklyScheduleStorageService.saveAll(newWeeklySchedules)
  weeklySchedules.value = await props.weeklyScheduleStorageService.getAll()
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
          <WeekdaysSelector class="d-flex flex-wrap" v-model="newWeekdaySet" />
        </div>

        <div class="form-group">
          <label>Start Time:</label>
          <TimeInput
            class="d-flex"
            v-model="newStartTime"
            hour-input-data-test="start-time-hour-input"
            minute-input-data-test="start-time-minute-input"
          />
        </div>

        <div class="form-group">
          <label>End Time:</label>
          <TimeInput
            class="d-flex"
            v-model="newEndTime"
            hour-input-data-test="end-time-hour-input"
            minute-input-data-test="end-time-minute-input"
          />
        </div>
      </div>
      <button type="button" class="btn btn-primary" data-test="add-button" @click="onClickAdd">
        Add
      </button>
      <div v-if="errorMessage" class="text-danger mt-2" data-test="error-message">
        {{ errorMessage }}
      </div>
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
          <button
            class="btn text-danger bg-transparent border-0"
            :data-test="`remove-schedule-with-index-${index}`"
            @click="onClickRemove(index)"
          >
            X
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
