<script setup lang="ts">
import { Weekday, WeeklySchedule } from '../../../domain/schedules'
import { Time } from '../../../domain/time'
import { capitalized } from '../../../utils/format'

const props = defineProps<{
  weeklySchedules: WeeklySchedule[]
}>()

const emit = defineEmits<{
  remove: [indexToRemove: number]
}>()

const formatTime = (time: Time) => {
  return time.toHhMmString()
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
        <span
          class="badge bg-success ms-2"
          data-test="target-focus-sessions"
          v-if="schedule.targetFocusSessions"
        >
          Target Focus Sessions: {{ schedule.targetFocusSessions }}
        </span>
      </div>
      <BButton
        class="bg-transparent text-danger border-0"
        :data-test="`remove-schedule-with-index-${index}`"
        @click="emit('remove', index)"
      >
        X
      </BButton>
    </li>
  </ul>
</template>
