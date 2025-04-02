<script setup lang="ts">
import { Duration } from '../domain/pomodoro/duration'
import { formatNumber, getNumberWithOrdinal } from '../utils/util'
import { computed, onBeforeMount, ref } from 'vue'
import type { Port } from '@/infra/communication'
import { WorkRequestName, type WorkRequest } from '../service_workers/request'
import { WorkResponseName, type WorkResponse } from '../service_workers/response'
import { PomodoroStage } from '../domain/pomodoro/stage'
import type { TimerConfigStorageService } from '../domain/pomodoro/config/storage'

const { port, timerConfigStorageService } = defineProps<{
  port: Port<WorkRequest, WorkResponse>
  timerConfigStorageService: TimerConfigStorageService
}>()

const durationLeft = ref<Duration>(new Duration({ seconds: 0 }))
const isRunning = ref(false)
const pomodoroStage = ref<PomodoroStage>(PomodoroStage.FOCUS)
const numOfPomodoriCompleted = ref(0)
const focusSessionsPerCycle = ref(0)

const displayTime = computed(() => {
  const totalSeconds = durationLeft.value.remainingSeconds()
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${formatNumber(minutes)}:${formatNumber(seconds)}`
})

const currentStage = computed(() => {
  switch (pomodoroStage.value) {
    case PomodoroStage.SHORT_BREAK:
      return `${getNumberWithOrdinal(numOfPomodoriCompleted.value)} Break`
    case PomodoroStage.LONG_BREAK:
      return getLongBreakLabel()
    default:
      return getFocusLabel(numOfPomodoriCompleted.value + 1)
  }
})

function getLongBreakLabel() {
  if (focusSessionsPerCycle.value > 1) {
    return 'Long Break'
  }
  return 'Break'
}

function getFocusLabel(nth: number) {
  if (focusSessionsPerCycle.value > 1) {
    return `${getNumberWithOrdinal(nth)} Focus`
  }
  return 'Focus'
}

onBeforeMount(async () => {
  timerConfigStorageService.get().then((timerConfig) => {
    focusSessionsPerCycle.value = timerConfig.focusSessionsPerCycle
  })

  port.onMessage((message) => {
    if (message.name !== WorkResponseName.TIMER_STATE || !message.payload) {
      return
    }

    pomodoroStage.value = message.payload.stage
    durationLeft.value = new Duration({ seconds: message.payload.remainingSeconds })
    isRunning.value = message.payload.isRunning
    numOfPomodoriCompleted.value = message.payload.numOfPomodoriCompleted
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
    <BButton
      v-if="isRunning"
      class="mt-3"
      variant="warning"
      data-test="pause-button"
      @click="onClickPause"
    >
      Pause
    </BButton>
    <BButton v-else variant="success" class="mt-3" data-test="start-button" @click="onClickStart">
      Start
    </BButton>
    <div class="mt-4">
      <BButton variant="dark" v-b-toggle.restart-menu>Restart</BButton>
      <BCollapse class="mt-2" id="restart-menu">
        <BRow v-for="nth in focusSessionsPerCycle" :key="nth">
          <BCol>
            <BButton
              class="mt-2 w-100"
              variant="primary"
              data-test="restart-focus"
              @click="onClickRestartFocus(nth)"
              >{{ getFocusLabel(nth) }}</BButton
            >
          </BCol>
          <BCol v-if="nth < focusSessionsPerCycle">
            <BButton
              class="mt-2 w-100"
              variant="secondary"
              data-test="restart-short-break"
              @click="onClickRestartShortBreak(nth)"
              >{{ getNumberWithOrdinal(nth) }} Break</BButton
            >
          </BCol>
          <BCol v-else>
            <BButton
              class="mt-2 w-100"
              variant="secondary"
              data-test="restart-long-break"
              @click="onClickRestartLongBreak"
              >{{ getLongBreakLabel() }}</BButton
            >
          </BCol>
        </BRow>
      </BCollapse>
    </div>
  </div>
</template>
