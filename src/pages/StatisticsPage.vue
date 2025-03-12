<script setup lang="ts">
import { DailyCutoffTimeStorageService } from '../domain/daily_cutoff_time/storage'
import { ref, onBeforeMount } from 'vue'
import { Time } from '../domain/time'
import type { ReloadService } from '@/chrome/reload'
import TimeInput from './components/TimeInput.vue'
import ContentTemplate from './components/ContentTemplate.vue'
import type { PomodoroRecordStorageService } from '../domain/pomodoro/record/storage'
import { getLastDateWithTime } from '../util'

type PomodoroStat = { day: string; completedPomodori: number }

const { dailyCutoffTimeStorageService, reloadService, currentDate, pomodoroRecordStorageService } =
  defineProps<{
    dailyCutoffTimeStorageService: DailyCutoffTimeStorageService
    reloadService: ReloadService
    currentDate: Date
    pomodoroRecordStorageService: PomodoroRecordStorageService
  }>()

const dailyCutoffTime = ref<Time>(new Time(0, 0))
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
  dailyCutoffTime.value = await dailyCutoffTimeStorageService.get()

  const records = await pomodoroRecordStorageService.getAll()
  let exclusiveEndDate = currentDate
  const inclusiveStartDate = getLastDateWithTime(dailyCutoffTime.value, exclusiveEndDate)
  for (let i = 0; i < pomodoroStats.value.length; i++) {
    pomodoroStats.value[i].completedPomodori = records.filter(
      (record) => record.completedAt >= inclusiveStartDate && record.completedAt < exclusiveEndDate
    ).length

    exclusiveEndDate = new Date(inclusiveStartDate)
    inclusiveStartDate.setDate(inclusiveStartDate.getDate() - 1)
  }
})

const onClickSave = async () => {
  const newTime = dailyCutoffTime.value
  return dailyCutoffTimeStorageService.save(newTime).then(() => {
    reloadService.trigger()
  })
}
</script>

<template>
  <ContentTemplate title="Statistics">
    <BFormGroup label="Set daily cutoff time:">
      <TimeInput v-model="dailyCutoffTime" data-test="time-input" />
    </BFormGroup>
    <BButton variant="primary" class="mt-4" data-test="save-button" @click="onClickSave"
      >Save</BButton
    >
    <div class="mt-4">
      <h3>Last 14 Days Completed Pomodori</h3>
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
