<script setup lang="ts">
import type { Duration } from '@/domain/pomodoro/duration'
import { formatNumber } from '../util'
import { computed, ref } from 'vue'

const { focusDuration } = defineProps<{ focusDuration: Duration }>()

const durationLeft = ref<Duration>(focusDuration)

const displayTime = computed(() => {
  const minutes = formatNumber(durationLeft.value.minutes)
  const seconds = formatNumber(durationLeft.value.seconds)
  return `${minutes}:${seconds}`
})
</script>

<template>
  <div class="container text-center mt-3 mb-3">
    <div class="display-1" data-test="timer-display">{{ displayTime }}</div>
    <button class="btn btn-success mt-3" data-test="start-button">Start</button>
  </div>
</template>
