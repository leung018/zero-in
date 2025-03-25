<script setup lang="ts">
import { DailyResetTimeStorageService } from '../domain/daily_reset_time/storage'
import { ref, onBeforeMount } from 'vue'
import { Time } from '../domain/time'
import type { ReloadService } from '@/chrome/reload'
import TimeInput from './components/TimeInput.vue'
import ContentTemplate from './components/ContentTemplate.vue'
import type { PomodoroRecordStorageService } from '../domain/pomodoro/record/storage'
import { getMostRecentDate } from '../util'
import type { Port } from '@/infra/communication'
import { WorkRequestName, type WorkRequest } from '../service_workers/request'
import { WorkResponseName, type WorkResponse } from '../service_workers/response'

type PomodoroStat = { day: string; completedPomodori: number }

const {
  dailyResetTimeStorageService,
  reloadService,
  getCurrentDate,
  pomodoroRecordStorageService,
  port
} = defineProps<{
  dailyResetTimeStorageService: DailyResetTimeStorageService
  reloadService: ReloadService
  getCurrentDate: () => Date
  pomodoroRecordStorageService: PomodoroRecordStorageService
  port: Port<WorkRequest, WorkResponse>
}>()

const dailyResetTime = ref<Time>(new Time(0, 0))
const pomodoroStats = ref<PomodoroStat[]>(initialPomodoroStats())

function initialPomodoroStats(): PomodoroStat[] {
  const stats = []
  stats.push({ day: 'Today', completedPomodori: 0 })
  stats.push({ day: 'Yesterday', completedPomodori: 0 })
  for (let i = 2; i < 7; i++) {
    stats.push({ day: `${i} days ago`, completedPomodori: 0 })
  }
  return stats
}

onBeforeMount(async () => {
  dailyResetTime.value = await dailyResetTimeStorageService.get()
  await setPomodoroStats(dailyResetTime.value)

  port.onMessage((message) => {
    if (message.name !== WorkResponseName.POMODORO_RECORDS_UPDATED) {
      return
    }
    setPomodoroStats(dailyResetTime.value)
  })

  port.send({
    name: WorkRequestName.LISTEN_TO_POMODORO_RECORDS_UPDATE
  })
})

async function setPomodoroStats(dailyResetTime: Time) {
  const records = await pomodoroRecordStorageService.getAll()
  let inclusiveEndDate = getCurrentDate()
  const inclusiveStartDate = getMostRecentDate(dailyResetTime, inclusiveEndDate)
  for (let i = 0; i < pomodoroStats.value.length; i++) {
    pomodoroStats.value[i].completedPomodori = records.filter(
      (record) => record.completedAt >= inclusiveStartDate && record.completedAt <= inclusiveEndDate
    ).length

    inclusiveEndDate = new Date(inclusiveStartDate)
    inclusiveStartDate.setDate(inclusiveStartDate.getDate() - 1)
  }
}

const onClickSave = async () => {
  const newTime = dailyResetTime.value
  return dailyResetTimeStorageService.save(newTime).then(() => {
    reloadService.trigger()
  })
}
</script>

<template>
  <ContentTemplate title="Statistics">
    <BFormGroup label="Set daily reset time:">
      <TimeInput v-model="dailyResetTime" data-test="time-input" />
      <p class="mt-1">
        <small>
          The time at which the day resets for tracking completed pomodori is used to adjust the
          statistics according to your preference.
        </small>
      </p>
    </BFormGroup>
    <BButton variant="primary" data-test="save-button" @click="onClickSave">Save</BButton>
    <div class="mt-4">
      <h3>Last 7 Days Completed Pomodori</h3>
      <table class="table" data-test="stats-table">
        <thead>
          <tr>
            <th>Day</th>
            <th>Completed Pomodori</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stat in pomodoroStats" :key="stat.day">
            <td data-test="day-field">{{ stat.day }}</td>
            <td data-test="completed-pomodori-field">{{ stat.completedPomodori }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </ContentTemplate>
</template>
