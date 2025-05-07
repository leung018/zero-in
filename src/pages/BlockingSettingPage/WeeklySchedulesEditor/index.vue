<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { Weekday, WeeklySchedule } from '../../../domain/schedules'
import type { WeeklyScheduleStorageService } from '../../../domain/schedules/storage'
import { Time } from '../../../domain/time'
import TimeInput from '../../components/TimeInput.vue'
import WeekdaysSelector from './WeekdaysSelector.vue'
import SchedulesList from './SchedulesList.vue'
import { WorkRequestName } from '../../../service_workers/request'
import type { ClientPort } from '@/service_workers/listener'

const { weeklyScheduleStorageService, port } = defineProps<{
  weeklyScheduleStorageService: WeeklyScheduleStorageService
  port: ClientPort
}>()

const newStartTime = ref<Time>(new Time(0, 0))
const newEndTime = ref<Time>(new Time(0, 0))

const newWeekdaySet = ref<Set<Weekday>>(new Set())

const newTargetFocusSessions = ref<number | undefined>(undefined)

const weeklySchedules = ref<WeeklySchedule[]>([])

const errorMessage = ref<string | null>(null)

const showSaved = computed(() => weeklySchedules.value.length > 0)

onBeforeMount(async () => {
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
    endTime: newEndTime.value,
    targetFocusSessions: newTargetFocusSessions.value
  })
  await updateWeeklySchedules([...weeklySchedules.value, newWeeklySchedule])

  errorMessage.value = null
  newStartTime.value = new Time(0, 0)
  newEndTime.value = new Time(0, 0)
  newWeekdaySet.value = new Set()
  newTargetFocusSessions.value = undefined
}

const handleRemove = async (indexToRemove: number) => {
  const newWeeklySchedules = weeklySchedules.value.filter((_, i) => i !== indexToRemove)
  await updateWeeklySchedules(newWeeklySchedules)
}

const updateWeeklySchedules = async (newWeeklySchedules: WeeklySchedule[]) => {
  await weeklyScheduleStorageService.saveAll(newWeeklySchedules)
  await port.send({ name: WorkRequestName.TOGGLE_BROWSING_RULES })
  weeklySchedules.value = newWeeklySchedules
}
</script>

<template>
  <p>
    <small>
      Set the schedules for blocking access to the configured domains to be active. If not set, it
      will remain active at all times.
    </small>
  </p>
  <b-form @submit.prevent>
    <b-form-group label="Repeat Schedule On:">
      <WeekdaysSelector class="d-flex flex-wrap" v-model="newWeekdaySet" />
    </b-form-group>

    <b-form-group label="Start Time:" class="mt-1">
      <TimeInput class="d-flex" v-model="newStartTime" data-test="start-time-input" />
    </b-form-group>

    <b-form-group label="End Time:">
      <TimeInput class="d-flex" v-model="newEndTime" data-test="end-time-input" />
    </b-form-group>

    <b-form-group label="Target Focus Sessions (optional):" class="mt-1">
      <b-form-input
        type="number"
        min="1"
        data-test="target-focus-sessions-input"
        v-model.number="newTargetFocusSessions"
      />
      <small>
        After completing your target focus sessions, the remaining schedule for that day will be
        inactive.
      </small>
    </b-form-group>
    <b-button
      variant="primary"
      class="mt-3"
      data-test="add-schedule-button"
      @click="onClickAdd"
      type="submit"
      >Add</b-button
    >
    <div v-if="errorMessage" class="text-danger mt-2" data-test="error-message">
      {{ errorMessage }}
    </div>
  </b-form>
  <div class="mt-4" data-test="saved-schedules-section" v-if="showSaved">
    <h3>Saved</h3>
    <SchedulesList :weeklySchedules="weeklySchedules" @remove="handleRemove" />
  </div>
</template>
