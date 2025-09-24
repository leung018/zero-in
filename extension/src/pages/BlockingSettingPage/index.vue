<script setup lang="ts">
import { UpdateSuccessNotifierService } from '@/infra/browser/update_success_notifier'
import {
  realBrowsingRulesStorageService,
  realTimerBasedBlockingRulesStorageService,
  realWeeklySchedulesStorageService
} from '@/infra/storage/factories/real'
import type { ClientPort } from '@/service_workers/listener'
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
        :browsingRulesStorageService="realBrowsingRulesStorageService()"
        :port="port"
      />
    </BCard>
    <BCard class="mb-4 shadow-sm">
      <h2 class="mb-3 mt-1">Timer-Based</h2>
      <TimerBasedSetting
        :timerBasedBlockingRulesStorageService="realTimerBasedBlockingRulesStorageService()"
        :updateSuccessNotifierService="new UpdateSuccessNotifierService()"
        :port="port"
      />
    </BCard>
    <BCard class="mb-4 shadow-sm">
      <h2 class="mb-3 mt-1">Schedules</h2>
      <WeeklySchedulesEditor
        :weeklySchedulesStorageService="realWeeklySchedulesStorageService()"
        :port="port"
      />
    </BCard>
  </ContentTemplate>
</template>
