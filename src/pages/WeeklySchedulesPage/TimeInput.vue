<script setup lang="ts">
import { computed } from 'vue'
import { Time } from '../../domain/schedules/time'

const props = defineProps<{
  hourInputDataTest: string
  minuteInputDataTest: string
}>()

const time = defineModel<Time>({
  required: true
})

const hour = computed({
  get: () => time.value.hour,
  set: (newHour: number) => {
    time.value = new Time(newHour, time.value.minute)
  }
})
const minute = computed({
  get: () => time.value.minute,
  set: (newMinute: number) => {
    time.value = new Time(time.value.hour, newMinute)
  }
})
</script>

<template>
  <div>
    <input
      type="number"
      min="0"
      max="23"
      placeholder="Hour"
      class="form-control w-auto me-2"
      v-model="hour"
      :data-test="props.hourInputDataTest"
    />
    <input
      type="number"
      min="0"
      max="59"
      placeholder="Minute"
      class="form-control w-auto"
      v-model="minute"
      :data-test="props.minuteInputDataTest"
    />
  </div>
</template>
