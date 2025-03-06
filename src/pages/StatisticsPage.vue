<script setup lang="ts">
import { DailyCutoffTimeStorageService } from '../domain/daily_cutoff_time/storage'
import { ref, onBeforeMount } from 'vue'
import { formatNumber } from '../util'

const { dailyCutoffTimeStorageService } = defineProps<{
  dailyCutoffTimeStorageService: DailyCutoffTimeStorageService
}>()
const dailyCutoffTimeStr = ref<String>('')

onBeforeMount(() => {
  dailyCutoffTimeStorageService.get().then((dailyCutoffTime) => {
    dailyCutoffTimeStr.value =
      formatNumber(dailyCutoffTime.hour) + ':' + formatNumber(dailyCutoffTime.minute)
  })
})
</script>

<template>
  <div class="container">
    <h1 class="mb-4 mt-4">Statistics</h1>
    <BFormGroup label="Set daily cutoff time:">
      <BFormInput
        type="time"
        style="width: 8rem"
        v-model="dailyCutoffTimeStr"
        data-test="timer-input"
      />
    </BFormGroup>
  </div>
</template>
