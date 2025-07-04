<script setup lang="ts">
import type { CurrentDateService } from '@/infra/current_date'
import type { ClientPort } from '@/service_workers/listener'
import { getMostRecentDate } from '@/utils/date'
import { computed, onBeforeMount, ref } from 'vue'
import type { DailyResetTimeStorageService } from '../domain/daily_reset_time/storage'
import { Time } from '../domain/time'
import type { FocusSessionRecordStorageService } from '../domain/timer/record/storage'
import { TimerStage } from '../domain/timer/stage'
import { StageDisplayLabelHelper } from '../domain/timer/stage_display_label'
import { WorkRequestName } from '../service_workers/request'
import { WorkResponseName } from '../service_workers/response'

const { port, focusSessionRecordStorageService, dailyResetTimeStorageService, currentDateService } =
  defineProps<{
    port: ClientPort
    focusSessionRecordStorageService: FocusSessionRecordStorageService
    dailyResetTimeStorageService: DailyResetTimeStorageService
    currentDateService: CurrentDateService
  }>()

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

onBeforeMount(async () => {
  port.onMessage((message) => {
    if (message.name !== WorkResponseName.TIMER_STATE || !message.payload) {
      return
    }
    timerStage.value = message.payload.stage
    focusSessionsPerCycle.value = message.payload.focusSessionsPerCycle
    focusSessionsCompleted.value = message.payload.focusSessionsCompleted
  })
  port.send({
    name: WorkRequestName.LISTEN_TO_TIMER
  })
  dailyResetTime.value = await dailyResetTimeStorageService.get()
  dailyCompletedFocusSessions.value = await getTotalFocusSessionsAfter(dailyResetTime.value)
})

async function getTotalFocusSessionsAfter(dailyResetTime: Time): Promise<number> {
  const startDate = getMostRecentDate(dailyResetTime, currentDateService.getDate())

  const totalFocusSessions = (
    await focusSessionRecordStorageService
      .getAll()
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
      Time's up! <br /><span class="hint-message" data-test="hint-message">{{ hintMsg }}.</span>
    </div>
    <BButton variant="success" data-test="start-button" @click="onClickStart">Start</BButton>
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
