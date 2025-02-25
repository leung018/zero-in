<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { PomodoroStage } from '../domain/pomodoro/stage'
import type { Port } from '../infra/communication'
import type { ActionService } from '../infra/action'
import type { PomodoroTimerResponse } from '../service_workers/response'
import { WorkRequestName, type WorkRequest } from '../service_workers/request'

const { port, closeCurrentTabService } = defineProps<{
  port: Port<WorkRequest, PomodoroTimerResponse>
  closeCurrentTabService: ActionService
}>()

const pomodoroStage = ref<PomodoroStage>(PomodoroStage.FOCUS)

const hintMsg = computed(() => {
  return pomodoroStage.value === PomodoroStage.SHORT_BREAK ? 'Start your break.' : 'Start focusing.'
})

onBeforeMount(() => {
  port.addListener((message) => {
    pomodoroStage.value = message.stage
  })
  port.send({
    name: WorkRequestName.POMODORO_QUERY
  })
})

const onClickStart = () => {
  port.send({
    name: WorkRequestName.POMODORO_START
  })
  closeCurrentTabService.trigger()
}
</script>

<template>
  <div class="container text-center mt-5">
    <div class="alert alert-info">
      Time's up! <br /><span class="hint-message" data-test="hint-message">{{ hintMsg }}</span>
    </div>
    <button class="btn btn-success" data-test="start-button" @click="onClickStart">Start</button>
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
