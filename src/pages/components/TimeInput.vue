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
      style="width: 8rem"
      v-model="timeStr"
      :data-test="dataTest"
      @change="onInputChange"
    />
  </div>
</template>
