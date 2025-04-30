<script setup lang="ts">
import { ChromeCommunicationManager } from './infra/chrome/communication'
import { TimerConfigStorageService } from './domain/pomodoro/config/storage'
import PomodoroTimerPage from './pages/PomodoroTimerPage.vue'

const openOptionsPage = () => {
  chrome.runtime.openOptionsPage()
}
</script>

<template>
  <div class="position-relative">
    <BButton
      data-test="options-button"
      @click="openOptionsPage"
      class="position-absolute top-0 end-0 p-0 me-2"
      variant="outline-secondary"
    >
      <IIcBaselineSettings />
    </BButton>
    <PomodoroTimerPage
      :port="new ChromeCommunicationManager().clientConnect()"
      :timerConfigStorageService="TimerConfigStorageService.create()"
    />
  </div>
</template>
