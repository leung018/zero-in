<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { PomodoroStage } from '../domain/pomodoro/stage'
import type { Port } from '../infra/communication'
import type { ActionService } from '../infra/action'
import type { PomodoroTimerResponse } from '../service_workers/response'
import { WorkRequestName, type WorkRequest } from '../service_workers/request'
import type { PomodoroRecordStorageService } from '../domain/pomodoro/record/storage'
import type { DailyCutoffTimeStorageService } from '../domain/daily_cutoff_time/storage'
import { Time } from '../domain/time'
import { getLastDateWithTime } from '../util'

const {
  port,
  closeCurrentTabService,
  pomodoroRecordStorageService,
  dailyCutoffTimeStorageService,
  currentDate
} = defineProps<{
  port: Port<WorkRequest, PomodoroTimerResponse>
  closeCurrentTabService: ActionService
  pomodoroRecordStorageService: PomodoroRecordStorageService
  dailyCutoffTimeStorageService: DailyCutoffTimeStorageService
  currentDate: Date
}>()

const pomodoroStage = ref<PomodoroStage>(PomodoroStage.FOCUS)
const dailyCompletedPomodori = ref(0)
const dailyCutoffTime = ref(new Time(0, 0))

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
    pomodoroStage.value = message.stage
  })
  port.send({
    name: WorkRequestName.LISTEN_TO_TIMER
  })
  dailyCutoffTime.value = await dailyCutoffTimeStorageService.get()
  dailyCompletedPomodori.value = await getTotalNumOfPomodoriAfter(dailyCutoffTime.value)
})

async function getTotalNumOfPomodoriAfter(dailyCutoffTime: Time): Promise<number> {
  const startDate = getLastDateWithTime(dailyCutoffTime, currentDate)

  const totalNumOfPomodori = (
    await pomodoroRecordStorageService
      .getAll()
      .then((records) => records.filter((record) => record.completedAt >= startDate))
  ).length
  return totalNumOfPomodori
}

const onClickStart = () => {
  port.send({
    name: WorkRequestName.START_TIMER
  })
  closeCurrentTabService.trigger()
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
        >Number of pomodori completed since last
        <span data-test="cutoff-time">{{ dailyCutoffTime.toHhMmString() }}</span></span
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
