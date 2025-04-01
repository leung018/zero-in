<script setup lang="ts">
import { computed, onBeforeMount, onMounted, ref } from 'vue'
import { PomodoroStage } from '../domain/pomodoro/stage'
import type { Port } from '../infra/communication'
import type { ActionService } from '../infra/action'
import { WorkResponseName, type WorkResponse } from '../service_workers/response'
import { WorkRequestName, type WorkRequest } from '../service_workers/request'
import type { FocusSessionRecordStorageService } from '../domain/pomodoro/record/storage'
import type { DailyResetTimeStorageService } from '../domain/daily_reset_time/storage'
import { Time } from '../domain/time'
import { getMostRecentDate } from '../utils/util'

const {
  port,
  soundService,
  focusSessionRecordStorageService,
  dailyResetTimeStorageService,
  currentDate
} = defineProps<{
  port: Port<WorkRequest, WorkResponse>
  soundService: ActionService
  focusSessionRecordStorageService: FocusSessionRecordStorageService
  dailyResetTimeStorageService: DailyResetTimeStorageService
  currentDate: Date
}>()

const pomodoroStage = ref<PomodoroStage>(PomodoroStage.FOCUS)
const dailyCompletedPomodori = ref(0)
const dailyResetTime = ref(new Time(0, 0))

const hintMsg = computed(() => {
  switch (pomodoroStage.value) {
    case PomodoroStage.SHORT_BREAK:
      return 'Take a break'
    case PomodoroStage.LONG_BREAK:
      return 'Take a longer break'
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
})

onMounted(() => {
  soundService.trigger()
})

async function getTotalNumOfPomodoriAfter(dailyResetTime: Time): Promise<number> {
  const startDate = getMostRecentDate(dailyResetTime, currentDate)

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
  max-width: 400px;
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
