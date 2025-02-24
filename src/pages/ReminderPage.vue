<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { PomodoroStage } from '../domain/pomodoro/stage'
import type { Port } from '../infra/communication'
import type { PomodoroTimerResponse } from '../service_workers/response'
import { EventName, type Event } from '../service_workers/event'

const { port } = defineProps<{
  port: Port<Event, PomodoroTimerResponse>
}>()

const pomodoroStage = ref<PomodoroStage>(PomodoroStage.FOCUS)

const hintMsg = computed(() => {
  return pomodoroStage.value === PomodoroStage.REST ? 'Start your break.' : 'Start focusing.'
})

onBeforeMount(() => {
  port.addListener((message) => {
    pomodoroStage.value = message.stage
  })
  port.send({
    name: EventName.POMODORO_QUERY
  })
})
</script>

<template>
  <div class="container text-center mt-5">
    <div class="alert alert-info">
      Time's up! <br /><span class="hint-message" data-test="hint-message">{{ hintMsg }}</span>
    </div>
    <button class="btn btn-success">Start</button>
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
