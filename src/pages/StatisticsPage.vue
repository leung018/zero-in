<script setup lang="ts">
import type { UpdateSuccessNotifierService } from '@/infra/browser/update_success_notifier'
import type { ClientPort } from '@/service_workers/listener'
import { getMostRecentDate } from '@/utils/date'
import { onBeforeMount, ref } from 'vue'
import { DailyResetTimeStorageService } from '../domain/daily_reset_time/storage'
import { Time } from '../domain/time'
import type { FocusSessionRecordStorageService } from '../domain/timer/record/storage'
import { CurrentDateService } from '../infra/current_date'
import { WorkRequestName } from '../service_workers/request'
import { WorkResponseName } from '../service_workers/response'
import ContentTemplate from './components/ContentTemplate.vue'
import TimeInput from './components/TimeInput.vue'

type Stat = { day: string; completedFocusSessions: number }

const {
  dailyResetTimeStorageService,
  updateSuccessNotifierService,
  currentDateService,
  focusSessionRecordStorageService,
  port
} = defineProps<{
  dailyResetTimeStorageService: DailyResetTimeStorageService
  updateSuccessNotifierService: UpdateSuccessNotifierService
  currentDateService: CurrentDateService
  focusSessionRecordStorageService: FocusSessionRecordStorageService
  port: ClientPort
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

onBeforeMount(async () => {
  dailyResetTime.value = await dailyResetTimeStorageService.get()
  await setStats(dailyResetTime.value)

  port.onMessage((message) => {
    if (message.name !== WorkResponseName.FOCUS_SESSION_RECORDS_UPDATED) {
      return
    }
    setStats(dailyResetTime.value)
  })

  port.send({
    name: WorkRequestName.LISTEN_TO_FOCUS_SESSION_RECORDS_UPDATE
  })
})

async function setStats(dailyResetTime: Time) {
  const records = await focusSessionRecordStorageService.getAll()
  let inclusiveEndDate = currentDateService.getDate()
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
    <BFormGroup label="Set daily reset time:">
      <TimeInput v-model="dailyResetTime" data-test="time-input" />
      <p class="mt-1">
        <small>
          The daily reset time for tracking completed focus sessions is used to adjust statistics
          based on your preference.
        </small>
      </p>
    </BFormGroup>
    <BButton variant="primary" data-test="save-button" @click="onClickSave">Save</BButton>
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
  </ContentTemplate>
</template>
