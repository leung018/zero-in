<script setup lang="ts">
import { formatTimeNumber, Time } from '../../domain/schedules/time'
import { Weekday, WeeklySchedule } from '../../domain/schedules'

const props = defineProps<{
  weeklySchedules: WeeklySchedule[]
}>()

const emit = defineEmits<{
  remove: [indexToRemove: number]
}>()

const formatTime = (Time: Time) => {
  return `${formatTimeNumber(Time.hour)}:${formatTimeNumber(Time.minute)}`
}
</script>

<template>
  <ul class="list-group">
    <li
      v-for="(schedule, index) in props.weeklySchedules"
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
        @click="emit('remove', index)"
      >
        <IMdiCrossCircleOutline />
      </button>
    </li>
  </ul>
</template>
