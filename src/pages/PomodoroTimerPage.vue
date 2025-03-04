<script setup lang="ts">
import { Duration } from '../domain/pomodoro/duration'
import { formatNumber, getNumberWithOrdinal } from '../util'
import { computed, onBeforeMount, ref } from 'vue'
import type { Port } from '@/infra/communication'
import { WorkRequestName, type WorkRequest } from '../service_workers/request'
import { type PomodoroTimerResponse } from '../service_workers/response'
import { PomodoroStage } from '../domain/pomodoro/stage'
import { BButton, BCol, BCollapse, BRow } from 'bootstrap-vue-next'

const { port } = defineProps<{
  port: Port<WorkRequest, PomodoroTimerResponse>
  numOfFocusPerCycle: number
}>()

const durationLeft = ref<Duration>(new Duration({ seconds: 0 }))
const isRunning = ref(false)
const pomodoroStage = ref<PomodoroStage>(PomodoroStage.FOCUS)

const displayTime = computed(() => {
  const totalSeconds = durationLeft.value.remainingSeconds()
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${formatNumber(minutes)}:${formatNumber(seconds)}`
})

const pomodoroStageMsg = computed(() => {
  switch (pomodoroStage.value) {
    case PomodoroStage.SHORT_BREAK:
      return 'Short Break'
    case PomodoroStage.LONG_BREAK:
      return 'Long Break'
    default:
      return 'Focus'
  }
})

onBeforeMount(() => {
  port.onMessage((message) => {
    pomodoroStage.value = message.stage
    durationLeft.value = new Duration({ seconds: message.remainingSeconds })
    isRunning.value = message.isRunning
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
</script>

<template>
  <div class="container text-center mt-3 mb-3">
    <h1 class="mb-4" data-test="pomodoro-stage">{{ pomodoroStageMsg }}</h1>
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
        <BRow v-for="index in numOfFocusPerCycle - 1" :key="index">
          <BCol>
            <BButton class="mt-2 w-100" variant="primary" data-test="restart-focus"
              >{{ getNumberWithOrdinal(index) }} Focus</BButton
            >
          </BCol>
          <BCol>
            <BButton class="mt-2 w-100" variant="secondary" data-test="restart-break"
              >{{ getNumberWithOrdinal(index) }} Break</BButton
            >
          </BCol>
        </BRow>
        <BRow>
          <BCol>
            <BButton class="mt-2 w-100" variant="primary" data-test="restart-focus"
              >{{ getNumberWithOrdinal(numOfFocusPerCycle) }} Focus</BButton
            >
          </BCol>
          <BCol>
            <BButton class="mt-2 w-100" variant="secondary" data-test="restart-break"
              >Long Break</BButton
            >
          </BCol>
        </BRow>
      </BCollapse>
    </div>
  </div>
</template>
