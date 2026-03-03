<script setup lang="ts">
import type { ClientPort } from '@/service-workers/listener'
import { Duration } from '@zero-in/shared/domain/timer/duration'
import { TimerStage } from '@zero-in/shared/domain/timer/stage'
import { formatNumber } from '@zero-in/shared/utils/format'
import { computed, ref } from 'vue'
import { StageDisplayLabelHelper } from '../domain/timer/stage-display-label'
import { WorkRequestName } from '../service-workers/request'
import { WorkResponseName } from '../service-workers/response'

const { port } = defineProps<{
  port: ClientPort
}>()

const durationLeft = ref<Duration>(new Duration({ seconds: 0 }))
const isRunning = ref(false)
const timerStage = ref<TimerStage>(TimerStage.FOCUS)
const focusSessionsCompleted = ref(0)
const focusSessionsPerCycle = ref(0)
const stageDisplayLabelHelper = computed(
  () =>
    new StageDisplayLabelHelper({
      focusSessionsPerCycle: focusSessionsPerCycle.value
    })
)

const displayTime = computed(() => {
  const totalSeconds = durationLeft.value.remainingSeconds()
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${formatNumber(minutes)}:${formatNumber(seconds)}`
})

const currentStage = computed(() => {
  return stageDisplayLabelHelper.value.getStageLabel({
    stage: timerStage.value,
    focusSessionsCompleted: focusSessionsCompleted.value
  })
})

// Subscribe to timer state
port.onMessage((message) => {
  if (message.name !== WorkResponseName.TIMER_STATE || !message.payload) {
    return
  }

  timerStage.value = message.payload.stage
  durationLeft.value = new Duration({ seconds: message.payload.remainingSeconds })
  isRunning.value = message.payload.isRunning
  focusSessionsCompleted.value = message.payload.focusSessionsCompleted
  focusSessionsPerCycle.value = message.payload.focusSessionsPerCycle
})
port.send({
  name: WorkRequestName.QUERY_TIMER_STATE
})

// onClick setup
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
              >{{ stageDisplayLabelHelper.getFocusLabel(nth) }}</BButton
            >
          </BCol>
          <BCol v-if="nth < focusSessionsPerCycle">
            <BButton
              class="mt-2 w-100"
              variant="secondary"
              data-test="restart-short-break"
              @click="onClickRestartShortBreak(nth)"
              >{{ stageDisplayLabelHelper.getShortBreakLabel(nth) }}</BButton
            >
          </BCol>
          <BCol v-else>
            <BButton
              class="mt-2 w-100"
              variant="secondary"
              data-test="restart-long-break"
              @click="onClickRestartLongBreak"
              >{{ stageDisplayLabelHelper.getLongBreakLabel() }}</BButton
            >
          </BCol>
        </BRow>
      </BCollapse>
    </div>
  </div>
</template>
