<script setup lang="ts">
import { DailyCutoffTimeStorageService } from '../domain/daily_cutoff_time/storage'
import { ref, onBeforeMount } from 'vue'
import { formatNumber } from '../util'
import { Time } from '../domain/time'

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

const onClickSave = async () => {
  const [hour, minute] = dailyCutoffTimeStr.value.split(':').map(Number)
  const newTime = new Time(hour, minute)
  return dailyCutoffTimeStorageService.save(newTime)
}
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
    <BButton variant="primary" class="mt-4" data-test="save-button" @click="onClickSave"
      >Save</BButton
    >
  </div>
</template>
