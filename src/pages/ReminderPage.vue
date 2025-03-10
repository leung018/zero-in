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

const {
  port,
  closeCurrentTabService,
  pomodoroRecordStorageService,
  dailyCutoffTimeStorageService
} = defineProps<{
  port: Port<WorkRequest, PomodoroTimerResponse>
  closeCurrentTabService: ActionService
  pomodoroRecordStorageService: PomodoroRecordStorageService
  dailyCutoffTimeStorageService: DailyCutoffTimeStorageService
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
  const date = new Date()

  date.setHours(dailyCutoffTime.hour)
  date.setMinutes(dailyCutoffTime.minute)

  const totalNumOfPomodori = (await pomodoroRecordStorageService.getRecordsOnOrAfter(date)).length
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
    <p data-test="daily-completed-pomodori-msg">
      Number of pomodori completed since {{ dailyCutoffTime.toHhMmString() }}:
      {{ dailyCompletedPomodori }}
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
</style>
