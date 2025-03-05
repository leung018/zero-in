<script setup lang="ts">
import { DailyRefreshTimeStorageService } from '../domain/statistics/daily_refresh_time'
import { ref, onBeforeMount } from 'vue'

const { dailyRefreshTimeStorageService } = defineProps<{
  dailyRefreshTimeStorageService: DailyRefreshTimeStorageService
}>()
const dailyRefreshTimeStr = ref<String>('')

onBeforeMount(() => {
  dailyRefreshTimeStorageService.get().then((dailyRefreshTime) => {
    dailyRefreshTimeStr.value = dailyRefreshTime.hour + ':' + dailyRefreshTime.minute
  })
})
</script>

<template>
  <div class="container">
    <h1 class="mb-4 mt-4">Statistics</h1>
    <BFormGroup label="Set daily refresh time:">
      <BFormInput
        type="time"
        style="width: 8rem"
        v-model="dailyRefreshTimeStr"
        data-test="timer-input"
      />
    </BFormGroup>
  </div>
</template>
