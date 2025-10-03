<script setup lang="ts">
import { Time } from '@zero-in/shared/domain/time/index'
import { ref, watch } from 'vue'

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
  const newTime = getTimeFromInput()
  if (newTime) {
    time.value = newTime
    return
  }

  time.value = new Time(0, 0)
  timeStr.value = time.value.toHhMmString()
}

const getTimeFromInput = (): Time | null => {
  const [hour, minute] = timeStr.value.split(':').map(Number)
  if (isNaN(hour) || isNaN(minute)) {
    return null
  }
  return new Time(hour, minute)
}
</script>

<template>
  <div>
    <BFormInput
      type="time"
      style="width: 10rem"
      v-model="timeStr"
      :data-test="dataTest"
      @change="onInputChange"
    />
  </div>
</template>
