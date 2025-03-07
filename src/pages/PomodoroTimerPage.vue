<script setup lang="ts">
import { Duration } from '../domain/pomodoro/duration'
import { formatNumber, getNumberWithOrdinal } from '../util'
import { computed, onBeforeMount, ref } from 'vue'
import type { Port } from '@/infra/communication'
import { WorkRequestName, type WorkRequest } from '../service_workers/request'
import { type PomodoroTimerResponse } from '../service_workers/response'
import { PomodoroStage } from '../domain/pomodoro/stage'

const { port } = defineProps<{
  port: Port<WorkRequest, PomodoroTimerResponse>
  numOfFocusPerCycle: number
}>()

const durationLeft = ref<Duration>(new Duration({ seconds: 0 }))
const isRunning = ref(false)
const pomodoroStage = ref<PomodoroStage>(PomodoroStage.FOCUS)
const numOfFocusCompleted = ref(0)

const displayTime = computed(() => {
  const totalSeconds = durationLeft.value.remainingSeconds()
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${formatNumber(minutes)}:${formatNumber(seconds)}`
})

const currentStage = computed(() => {
  switch (pomodoroStage.value) {
    case PomodoroStage.SHORT_BREAK:
      return `${getNumberWithOrdinal(numOfFocusCompleted.value)} Short Break`
    case PomodoroStage.LONG_BREAK:
      return 'Long Break'
    default:
      return `${getNumberWithOrdinal(numOfFocusCompleted.value + 1)} Focus`
  }
})

onBeforeMount(() => {
  port.onMessage((message) => {
    pomodoroStage.value = message.stage
    durationLeft.value = new Duration({ seconds: message.remainingSeconds })
    isRunning.value = message.isRunning
    numOfFocusCompleted.value = message.numOfFocusCompleted
  })
  port.send({
    name: WorkRequestName.LISTEN_TO_TIMER
  })
})

const onClickStart = () => {
  port.send({
    name: WorkRequestName.START_TIMER
  })
}

const onClickPause = () => {
  port.send({
    name: WorkRequestName.PAUSE_TIMER
  })
}

const onClickRestartFocus = (nth: number) => {
  port.send({
    name: WorkRequestName.RESTART_FOCUS,
    payload: {
      nth
    }
  })
}

const onClickRestartShortBreak = (nth: number) => {
  port.send({
    name: WorkRequestName.RESTART_SHORT_BREAK,
    payload: {
      nth
    }
  })
}

const onClickRestartLongBreak = () => {
  port.send({
    name: WorkRequestName.RESTART_LONG_BREAK
  })
}
</script>

<template>
  <div class="container text-center mt-3 mb-3">
    <h1 class="mb-4" data-test="current-stage">{{ currentStage }}</h1>
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
    <div class="mt-4">
      <BButton variant="dark" v-b-toggle.restart-menu>Restart</BButton>
      <BCollapse class="mt-2" id="restart-menu">
        <BRow v-for="nth in numOfFocusPerCycle - 1" :key="nth">
          <BCol>
            <BButton
              class="mt-2 w-100"
              variant="primary"
              data-test="restart-focus"
              @click="onClickRestartFocus(nth)"
              >{{ getNumberWithOrdinal(nth) }} Focus</BButton
            >
          </BCol>
          <BCol>
            <BButton
              class="mt-2 w-100"
              variant="secondary"
              data-test="restart-short-break"
              @click="onClickRestartShortBreak(nth)"
              >{{ getNumberWithOrdinal(nth) }} Break</BButton
            >
          </BCol>
        </BRow>
        <BRow>
          <BCol>
            <BButton
              class="mt-2 w-100"
              variant="primary"
              data-test="restart-focus"
              @click="onClickRestartFocus(numOfFocusPerCycle)"
              >{{ getNumberWithOrdinal(numOfFocusPerCycle) }} Focus</BButton
            >
          </BCol>
          <BCol>
            <BButton
              class="mt-2 w-100"
              variant="secondary"
              data-test="restart-long-break"
              @click="onClickRestartLongBreak"
              >Long Break</BButton
            >
          </BCol>
        </BRow>
      </BCollapse>
    </div>
  </div>
</template>
