<script setup lang="ts">
import type { CurrentDateService } from '@/infra/current_date'
import type { ClientPort } from '@/service_workers/listener'
import { computed, onBeforeMount, ref } from 'vue'
import type { DailyResetTimeStorageService } from '../domain/daily_reset_time/storage'
import type { FocusSessionRecordStorageService } from '../domain/timer/record/storage'
import { TimerStage } from '../domain/timer/stage'
import { Time } from '../domain/time'
import { WorkRequestName } from '../service_workers/request'
import { WorkResponseName } from '../service_workers/response'
import { getMostRecentDate } from '@/utils/date'

const { port, focusSessionRecordStorageService, dailyResetTimeStorageService, currentDateService } =
  defineProps<{
    port: ClientPort
    focusSessionRecordStorageService: FocusSessionRecordStorageService
    dailyResetTimeStorageService: DailyResetTimeStorageService
    currentDateService: CurrentDateService
  }>()

const pomodoroStage = ref<TimerStage>(TimerStage.FOCUS)
const dailyCompletedPomodori = ref(0)
const dailyResetTime = ref(new Time(0, 0))

const hintMsg = computed(() => {
  switch (pomodoroStage.value) {
    case TimerStage.SHORT_BREAK:
      return 'Take a short break'
    case TimerStage.LONG_BREAK:
      return 'Take a break'
    default:
      return 'Start focusing'
  }
})

onBeforeMount(async () => {
  port.onMessage((message) => {
    if (message.name !== WorkResponseName.TIMER_STATE || !message.payload) {
      return
    }
    pomodoroStage.value = message.payload.stage
  })
  port.send({
    name: WorkRequestName.LISTEN_TO_TIMER
  })
  dailyResetTime.value = await dailyResetTimeStorageService.get()
  dailyCompletedPomodori.value = await getTotalNumOfPomodoriAfter(dailyResetTime.value)

  // @ts-ignore: Exposing port for e2e test to simulate situation that the port is disconnected
  window._port = port
})

async function getTotalNumOfPomodoriAfter(dailyResetTime: Time): Promise<number> {
  const startDate = getMostRecentDate(dailyResetTime, currentDateService.getDate())

  const totalNumOfPomodori = (
    await focusSessionRecordStorageService
      .getAll()
      .then((records) => records.filter((record) => record.completedAt >= startDate))
  ).length
  return totalNumOfPomodori
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
      <span class="daily-completed-pomodori ms-2" data-test="daily-completed-pomodori">{{
        dailyCompletedPomodori
      }}</span>
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

.daily-completed-pomodori {
  font-weight: bold;
  color: #28a745;
}
</style>
