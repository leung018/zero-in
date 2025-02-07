<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Weekday, WeeklySchedule } from '../../domain/schedules'
import type { WeeklyScheduleStorageService } from '../../domain/schedules/storage'
import { Time } from '../../domain/schedules/time'
import TimeInput from './TimeInput.vue'
import WeekdaysSelector from './WeekdaysSelector.vue'
import SchedulesList from './SchedulesList.vue'
import type { Sender } from '@/domain/messenger'
import { EventName } from '../../event'

const { weeklyScheduleStorageService, sender } = defineProps<{
  weeklyScheduleStorageService: WeeklyScheduleStorageService
  sender: Sender
}>()

const newStartTime = ref<Time>(new Time(0, 0))
const newEndTime = ref<Time>(new Time(0, 0))

const newWeekdaySet = ref<Set<Weekday>>(new Set())

const weeklySchedules = ref<WeeklySchedule[]>([])

const errorMessage = ref<string | null>(null)

onMounted(async () => {
  weeklySchedules.value = await weeklyScheduleStorageService.getAll()
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
  newWeekdaySet.value = new Set()
}

const handleRemove = async (indexToRemove: number) => {
  const newWeeklySchedules = weeklySchedules.value.filter((_, i) => i !== indexToRemove)
  await updateWeeklySchedules(newWeeklySchedules)
}

const updateWeeklySchedules = async (newWeeklySchedules: WeeklySchedule[]) => {
  await weeklyScheduleStorageService.saveAll(newWeeklySchedules)
  await sender.send({ name: EventName.TOGGLE_REDIRECT_RULES })
  weeklySchedules.value = newWeeklySchedules
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
      <SchedulesList :weeklySchedules="weeklySchedules" @remove="handleRemove" />
    </div>
  </div>
</template>
