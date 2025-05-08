<script setup lang="ts">
import { ref, watch } from 'vue'
import { Time } from '../../domain/time'

const { dataTest } = defineProps<{
  dataTest: string
}>()

const time = defineModel<Time>({
  required: true
})

const timeStr = ref(time.value.toHhMmString())

watch(time, (newTime) => {
  timeStr.value = newTime.toHhMmString()
})

const onInputChange = () => {
  let [hour, minute] = timeStr.value.split(':').map(Number)

  let hasReset = false
  if (isNaN(hour)) {
    hour = 0
    hasReset = true
  }
  if (isNaN(minute)) {
    minute = 0
    hasReset = true
  }
  time.value = new Time(hour, minute)

  if (hasReset) {
    timeStr.value = time.value.toHhMmString()
  }
}
</script>

<template>
  <div>
    <BFormInput
      type="time"
      style="width: 8rem"
      v-model="timeStr"
      :data-test="dataTest"
      @change="onInputChange"
    />
  </div>
</template>
