<script setup lang="ts">
import { BrowsingRulesStorageService } from '@/domain/browsing_rules/storage'
import { WeeklySchedulesStorageService } from '@/domain/schedules/storage'
import { TimerBasedBlockingRulesStorageService } from '@/domain/timer_based_blocking/storage'
import { UpdateSuccessNotifierService } from '@/infra/browser/update_success_notifier'
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
        :browsing-rules-storage-service="BrowsingRulesStorageService.create()"
        :port="port"
      />
    </BCard>
    <BCard class="mb-4 shadow-sm">
      <h2 class="mb-3 mt-1">Timer-Based</h2>
      <TimerBasedSetting
        :timerBasedBlockingRulesStorageService="TimerBasedBlockingRulesStorageService.create()"
        :update-success-notifier-service="new UpdateSuccessNotifierService()"
        :port="port"
      />
    </BCard>
    <BCard class="mb-4 shadow-sm">
      <h2 class="mb-3 mt-1">Schedules</h2>
      <WeeklySchedulesEditor
        :weekly-schedules-storage-service="WeeklySchedulesStorageService.create()"
        :port="port"
      />
    </BCard>
  </ContentTemplate>
</template>
