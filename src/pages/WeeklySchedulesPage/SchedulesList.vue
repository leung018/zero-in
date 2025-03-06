<script setup lang="ts">
import { Time } from '../../domain/time'
import { formatNumber } from '../../util'
import { Weekday, WeeklySchedule } from '../../domain/schedules'
import { capitalized } from '../../util'

const props = defineProps<{
  weeklySchedules: WeeklySchedule[]
}>()

const emit = defineEmits<{
  remove: [indexToRemove: number]
}>()

const formatTime = (Time: Time) => {
  return `${formatNumber(Time.hour)}:${formatNumber(Time.minute)}`
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
            .map((day) => capitalized(Weekday[day]))
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
        X
      </button>
    </li>
  </ul>
</template>
