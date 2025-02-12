<script setup lang="ts">
import type { Duration } from '@/domain/pomodoro/duration'
import { computed, ref } from 'vue'

const { focusDuration } = defineProps<{ focusDuration: Duration }>()

const durationLeft = ref<Duration>(focusDuration)

const displayTime = computed(() => {
  const minutes = String(durationLeft.value.minutes).padStart(2, '0')
  const seconds = String(durationLeft.value.seconds).padStart(2, '0')
  return `${minutes}:${seconds}`
})
</script>

<template>
  <div class="container text-center mt-3 mb-3">
    <div class="display-1" data-test="timer-display">{{ displayTime }}</div>
    <button class="btn btn-success mt-3" data-test="start-button">Start</button>
  </div>
</template>
