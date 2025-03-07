<script setup lang="ts">
import { DailyCutoffTimeStorageService } from '../domain/daily_cutoff_time/storage'
import { ref, onBeforeMount } from 'vue'
import { Time } from '../domain/time'
import type { ReloadService } from '@/chrome/reload'
import TimeInput from './components/TimeInput.vue'
import ContentTemplate from './components/ContentTemplate.vue'

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
</script>

<template>
  <ContentTemplate title="Statistics">
    <BFormGroup label="Set daily cutoff time:">
      <TimeInput v-model="dailyCutoffTime" data-test="time-input" />
    </BFormGroup>
    <BButton variant="primary" class="mt-4" data-test="save-button" @click="onClickSave"
      >Save</BButton
    >
  </ContentTemplate>
</template>
