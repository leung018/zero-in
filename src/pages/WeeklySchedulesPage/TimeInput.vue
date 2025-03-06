<script setup lang="ts">
import { computed } from 'vue'
import { Time } from '../../domain/time'
import { formatNumber } from '../../util'

const { dataTest } = defineProps<{
  dataTest: string
}>()

const time = defineModel<Time>({
  required: true
})

const timeStr = computed({
  get: () => {
    return formatNumber(time.value.hour) + ':' + formatNumber(time.value.minute)
  },
  set: (value: string) => {
    const [hour, minute] = value.split(':').map(Number)
    time.value = new Time(hour, minute)
  }
})
</script>

<template>
  <div>
    <BFormInput type="time" style="width: 8rem" v-model="timeStr" :data-test="dataTest" />
  </div>
</template>
