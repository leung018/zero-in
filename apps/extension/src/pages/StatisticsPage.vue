<script setup lang="ts">
import type { UpdateSuccessNotifierService } from '@/infra/browser/update-success-notifier'
import { Time } from '@zero-in/shared/domain/time/index'
import type { FocusSessionRecordsStorageService } from '@zero-in/shared/domain/timer/record/storage'
import { getMostRecentDate } from '@zero-in/shared/utils/date'
import { ref } from 'vue'
import { DailyResetTimeStorageService } from '../domain/daily-reset-time/storage'
import ContentTemplate from './components/ContentTemplate.vue'
import LoadingWrapper from './components/LoadingWrapper.vue'
import TimeInput from './components/TimeInput.vue'

type Stat = { day: string; completedFocusSessions: number }

const {
  dailyResetTimeStorageService,
  updateSuccessNotifierService,
  focusSessionRecordsStorageService
} = defineProps<{
  dailyResetTimeStorageService: DailyResetTimeStorageService
  updateSuccessNotifierService: UpdateSuccessNotifierService
  focusSessionRecordsStorageService: FocusSessionRecordsStorageService
}>()

const dailyResetTime = ref<Time>(new Time(0, 0))
const stats = ref<Stat[]>(initialStats())

function initialStats(): Stat[] {
  const stats = []
  stats.push({ day: 'Today', completedFocusSessions: 0 })
  stats.push({ day: 'Yesterday', completedFocusSessions: 0 })
  for (let i = 2; i < 7; i++) {
    stats.push({ day: `${i} days ago`, completedFocusSessions: 0 })
  }
  return stats
}

const isLoading = ref(true)
dailyResetTimeStorageService.get().then(async (time) => {
  dailyResetTime.value = time
  await setStats(time)
  isLoading.value = false
})

async function setStats(dailyResetTime: Time) {
  const records = await focusSessionRecordsStorageService.get()
  let inclusiveEndDate = new Date()
  const inclusiveStartDate = getMostRecentDate(dailyResetTime, inclusiveEndDate)
  for (let i = 0; i < stats.value.length; i++) {
    stats.value[i].completedFocusSessions = records.filter(
      (record) => record.completedAt >= inclusiveStartDate && record.completedAt <= inclusiveEndDate
    ).length

    inclusiveEndDate = new Date(inclusiveStartDate)
    inclusiveStartDate.setDate(inclusiveStartDate.getDate() - 1)
  }
}

const onClickSave = async () => {
  const newTime = dailyResetTime.value
  return dailyResetTimeStorageService.save(newTime).then(() => {
    updateSuccessNotifierService.trigger()
  })
}
</script>

<template>
  <ContentTemplate title="Statistics">
    <LoadingWrapper :isLoading="isLoading">
      <BFormGroup label="Set daily reset time:">
        <TimeInput v-model="dailyResetTime" data-test="time-input" />
        <p class="mt-1">
          <small>
            The daily reset time defines when a new day starts for tracking focus sessions. For
            example, with a 4:00 AM reset, sessions completed between 4:00 AM today and 3:59 AM
            tomorrow count as today's.
          </small>
        </p>
      </BFormGroup>
      <BButton variant="primary" data-test="daily-reset-time-save-button" @click="onClickSave"
        >Save</BButton
      >
      <div class="mt-4">
        <h2>Last 7 Days</h2>
        <table class="table" data-test="stats-table">
          <thead>
            <tr>
              <th>Day</th>
              <th>Focus Sessions Completed</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stat in stats" :key="stat.day">
              <td data-test="day-field">{{ stat.day }}</td>
              <td data-test="completed-focus-sessions">{{ stat.completedFocusSessions }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </LoadingWrapper>
  </ContentTemplate>
</template>
