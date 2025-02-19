<script setup lang="ts">
import { Duration } from '../domain/pomodoro/duration'
import { formatNumber } from '../util'
import { computed, ref } from 'vue'
import type { Port } from '@/infra/communication'
import { EventName, type MappedEvents } from '../service_workers/event'
import type { MappedResponses, ResponseName } from '../service_workers/response'

const { port } = defineProps<{
  port: Port<
    MappedEvents[EventName.POMODORO_QUERY | EventName.POMODORO_START],
    MappedResponses[ResponseName.POMODORO_TIMER_STATE]
  >
}>()

const durationLeft = ref<Duration>(new Duration({ seconds: 0 }))
const isRunning = ref(false)

const displayTime = computed(() => {
  const minutes = formatNumber(durationLeft.value.minutes)
  const seconds = formatNumber(durationLeft.value.seconds)
  return `${minutes}:${seconds}`
})

port.addListener((message) => {
  durationLeft.value = new Duration({ seconds: message.payload.remainingSeconds })
  isRunning.value = message.payload.isRunning
})
port.send({
  name: EventName.POMODORO_QUERY,
  payload: undefined
})

const onClickStart = () => {
  port.send({
    name: EventName.POMODORO_START,
    payload: undefined
  })
  isRunning.value = true
}
</script>

<template>
  <div class="container text-center mt-3 mb-3">
    <div class="display-1" data-test="timer-display">{{ displayTime }}</div>
    <button v-if="isRunning" class="btn btn-warning mt-3" data-test="pause-button">Pause</button>
    <button v-else class="btn btn-success mt-3" data-test="start-button" @click="onClickStart">
      Start
    </button>
  </div>
</template>
