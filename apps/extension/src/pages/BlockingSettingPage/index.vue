<script setup lang="ts">
import { BrowsingRulesStorageService } from '@/domain/browsing-rules/storage'
import { newWeeklySchedulesStorageService } from '@/domain/schedules/storage'
import { TimerBasedBlockingRulesStorageService } from '@/domain/timer-based-blocking/storage'
import { UpdateSuccessNotifierService } from '@/infra/browser/update-success-notifier'
import type { ClientPort } from '@/service-workers/listener'
import ContentTemplate from '../components/ContentTemplate.vue'
import BlockedDomainsEditor from './BlockedDomainsEditor.vue'
import TimerBasedSetting from './TimerBasedSetting.vue'
import WeeklySchedulesEditor from './WeeklySchedulesEditor/index.vue'

const { port } = defineProps<{
  port: ClientPort
}>()
</script>

<template>
  <ContentTemplate title="Blocking">
    <BCard class="mb-4 shadow-sm">
      <h2 class="mb-3 mt-1">Blocked Domains</h2>
      <BlockedDomainsEditor
        :browsingRulesStorageService="BrowsingRulesStorageService.create()"
        :port="port"
      />
    </BCard>
    <BCard class="mb-4 shadow-sm">
      <h2 class="mb-3 mt-1">Timer-Based</h2>
      <TimerBasedSetting
        :timerBasedBlockingRulesStorageService="TimerBasedBlockingRulesStorageService.create()"
        :updateSuccessNotifierService="new UpdateSuccessNotifierService()"
        :port="port"
      />
    </BCard>
    <BCard class="mb-4 shadow-sm">
      <h2 class="mb-3 mt-1">Schedules</h2>
      <WeeklySchedulesEditor
        :weeklySchedulesStorageService="newWeeklySchedulesStorageService()"
        :port="port"
      />
    </BCard>
  </ContentTemplate>
</template>
