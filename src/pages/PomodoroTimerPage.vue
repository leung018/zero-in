<script setup lang="ts">
import type { Duration } from '@/domain/pomodoro/duration'
import { formatNumber } from '../util'
import { computed, ref } from 'vue'
import type { Timer } from '@/domain/pomodoro/timer'

const { focusDuration, timer } = defineProps<{ focusDuration: Duration; timer: Timer }>()

const durationLeft = ref<Duration>(focusDuration)

const displayTime = computed(() => {
  const minutes = formatNumber(durationLeft.value.minutes)
  const seconds = formatNumber(durationLeft.value.seconds)
  return `${minutes}:${seconds}`
})

const onClickStart = () => {
  timer.setOnTick((timerRemainingDuration) => {
    durationLeft.value = timerRemainingDuration
  })
  timer.start(focusDuration)
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
