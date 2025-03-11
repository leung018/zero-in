<script setup lang="ts">
import { DailyCutoffTimeStorageService } from '../domain/daily_cutoff_time/storage'
import { ref, onBeforeMount } from 'vue'
import { Time } from '../domain/time'
import type { ReloadService } from '@/chrome/reload'
import TimeInput from './components/TimeInput.vue'
import ContentTemplate from './components/ContentTemplate.vue'
import { Weekday } from '../domain/schedules'
import { capitalized } from '../util'

const { dailyCutoffTimeStorageService, reloadService } = defineProps<{
  dailyCutoffTimeStorageService: DailyCutoffTimeStorageService
  reloadService: ReloadService
}>()

const dailyCutoffTime = ref<Time>(new Time(0, 0))

onBeforeMount(() => {
  dailyCutoffTimeStorageService.get().then((time) => {
    dailyCutoffTime.value = time
  })
})

const onClickSave = async () => {
  const newTime = dailyCutoffTime.value
  return dailyCutoffTimeStorageService.save(newTime).then(() => {
    reloadService.trigger()
  })
}

const WEEKDAYS: Weekday[] = Object.values(Weekday).filter((v) => typeof v === 'number') as Weekday[]
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
            <th v-for="weekday in WEEKDAYS" :key="weekday">
              {{ capitalized(Weekday[weekday]) }}
            </th>
          </tr>
        </thead>
      </table>
    </div>
  </ContentTemplate>
</template>
