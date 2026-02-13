<script setup lang="ts">
import type { ClientPort } from '@/service-workers/listener'
import { Time } from '@zero-in/shared/domain/time/index'
import type { FocusSessionRecordsStorageService } from '@zero-in/shared/domain/timer/record/storage'
import { getMostRecentDate } from '@zero-in/shared/utils/date'
import { computed, ref } from 'vue'
import type { DailyResetTimeStorageService } from '../domain/daily-reset-time/storage'
import { TimerStage } from '../domain/timer/stage'
import { StageDisplayLabelHelper } from '../domain/timer/stage-display-label'
import { WorkRequestName } from '../service-workers/request'
import { WorkResponseName } from '../service-workers/response'
import LoadingWrapper from './components/LoadingWrapper.vue'

const { port, focusSessionRecordsStorageService, dailyResetTimeStorageService } = defineProps<{
  port: ClientPort
  focusSessionRecordsStorageService: FocusSessionRecordsStorageService
  dailyResetTimeStorageService: DailyResetTimeStorageService
}>()

const gotTimerState = ref(false)
const gotStatistics = ref(false)

const timerStage = ref<TimerStage>(TimerStage.FOCUS)
const focusSessionsPerCycle = ref(0)
const focusSessionsCompleted = ref(0)
const dailyCompletedFocusSessions = ref(0)
const dailyResetTime = ref(new Time(0, 0))

const hintMsg = computed(() => {
  const stageDisplayLabelHelper = new StageDisplayLabelHelper({
    focusSessionsPerCycle: focusSessionsPerCycle.value
  })
  const stageLabel = stageDisplayLabelHelper.getStageLabel({
    stage: timerStage.value,
    focusSessionsCompleted: focusSessionsCompleted.value
  })
  return `Start ${stageLabel}`
})

// Subscribe to timer state
port.onMessage((message) => {
  if (message.name !== WorkResponseName.TIMER_STATE || !message.payload) {
    return
  }
  timerStage.value = message.payload.stage
  focusSessionsPerCycle.value = message.payload.focusSessionsPerCycle
  focusSessionsCompleted.value = message.payload.focusSessionsCompleted

  gotTimerState.value = true
})
port.send({
  name: WorkRequestName.QUERY_TIMER_STATE
})

// Get stats of today focus sessions completed
dailyResetTimeStorageService
  .get()
  .then((dailyResetTimeValue) => {
    dailyResetTime.value = dailyResetTimeValue
    return dailyResetTimeValue
  })
  .then((dailyResetTimeValue) => {
    return getTotalFocusSessionsAfter(dailyResetTimeValue)
  })
  .then((totalFocusSessions) => {
    dailyCompletedFocusSessions.value = totalFocusSessions

    gotStatistics.value = true
  })

async function getTotalFocusSessionsAfter(dailyResetTime: Time): Promise<number> {
  const startDate = getMostRecentDate(dailyResetTime)

  const totalFocusSessions = (
    await focusSessionRecordsStorageService
      .get()
      .then((records) => records.filter((record) => record.completedAt >= startDate))
  ).length
  return totalFocusSessions
}

const onClickStart = () => {
  port.send({
    name: WorkRequestName.START_TIMER
  })
}
</script>

<template>
  <div class="container text-center mt-5">
    <div class="alert alert-info">
      Time's up! <br />
      <LoadingWrapper :isLoading="!gotTimerState">
        <span class="hint-message" data-test="hint-message">{{ hintMsg }}.</span>
      </LoadingWrapper>
    </div>
    <BButton variant="success" data-test="start-button" @click="onClickStart">Start</BButton>
    <LoadingWrapper :isLoading="!gotStatistics">
      <p class="mt-3">
        <span
          >Number of focus sessions completed since last
          <span data-test="reset-time">{{ dailyResetTime.toHhMmString() }}</span></span
        >
        <span
          class="daily-completed-focus-sessions ms-2"
          data-test="daily-completed-focus-sessions"
          >{{ dailyCompletedFocusSessions }}</span
        >
      </p>
    </LoadingWrapper>
  </div>
</template>

<style scoped>
.container {
  max-width: 430px;
}

.alert {
  font-size: 1.5rem;
}

.hint-message {
  font-size: 2rem;
}

.daily-completed-focus-sessions {
  font-weight: bold;
  color: #28a745;
}
</style>
