<script setup lang="ts">
import { Duration } from '../domain/pomodoro/duration'
import { formatNumber } from '../util'
import { computed, onMounted, ref } from 'vue'
import type { Port } from '@/infra/port'
import { EventName } from '../event'

const { focusDuration, port } = defineProps<{
  focusDuration: Duration
  port: Port
}>()

const durationLeft = ref<Duration>(focusDuration)

const displayTime = computed(() => {
  const minutes = formatNumber(durationLeft.value.minutes)
  const seconds = formatNumber(durationLeft.value.seconds)
  return `${minutes}:${seconds}`
})

onMounted(() => {
  port.addListener((message) => {
    durationLeft.value = new Duration({ seconds: message })
  })
})

const onClickStart = () => {
  port.send({ name: EventName.POMODORO_START, initial: focusDuration.totalSeconds })
}
</script>

<template>
  <div class="container text-center mt-3 mb-3">
    <div class="display-1" data-test="timer-display">{{ displayTime }}</div>
    <button class="btn btn-success mt-3" data-test="start-button" @click="onClickStart">
      Start
    </button>
  </div>
</template>
