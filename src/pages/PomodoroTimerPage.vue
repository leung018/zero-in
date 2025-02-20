<script setup lang="ts">
import { Duration } from '../domain/pomodoro/duration'
import { formatNumber } from '../util'
import { computed, onBeforeMount, ref } from 'vue'
import type { Port } from '@/infra/communication'
import { EventName, type Event } from '../service_workers/event'
import { PomodoroState, type PomodoroTimerResponse } from '../service_workers/response'

const { port } = defineProps<{
  port: Port<Event, PomodoroTimerResponse>
}>()

const durationLeft = ref<Duration>(new Duration({ seconds: 0 }))
const isRunning = ref(false)
const pomodoroState = ref<PomodoroState>(PomodoroState.FOCUS)

const displayTime = computed(() => {
  const minutes = formatNumber(durationLeft.value.minutes)
  const seconds = formatNumber(durationLeft.value.seconds)
  return `${minutes}:${seconds}`
})

const pomodoroStateMsg = computed(() =>
  pomodoroState.value === PomodoroState.FOCUS ? 'Focus' : 'Take a Break'
)

onBeforeMount(() => {
  port.addListener((message) => {
    pomodoroState.value = message.pomodoroState
    durationLeft.value = new Duration({ seconds: message.remainingSeconds })
    isRunning.value = message.isRunning
  })
  port.send({
    name: EventName.POMODORO_QUERY
  })
})

const onClickStart = () => {
  port.send({
    name: EventName.POMODORO_START
  })
  isRunning.value = true
}

const onClickPause = () => {
  port.send({
    name: EventName.POMODORO_PAUSE
  })
  isRunning.value = false
}
</script>

<template>
  <div class="container text-center mt-3 mb-3">
    <h1 class="mb-4" data-test="pomodoro-state">{{ pomodoroStateMsg }}</h1>
    <div class="display-1" data-test="timer-display">{{ displayTime }}</div>
    <button
      v-if="isRunning"
      class="btn btn-warning mt-3"
      data-test="pause-button"
      @click="onClickPause"
    >
      Pause
    </button>
    <button v-else class="btn btn-success mt-3" data-test="start-button" @click="onClickStart">
      Start
    </button>
  </div>
</template>
