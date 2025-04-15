<script setup lang="ts">
import type { Port } from '@/infra/communication'
import { BrowsingRulesStorageService } from 'src/domain/browsing_rules/storage'
import { WeeklyScheduleStorageService } from 'src/domain/schedules/storage'
import ContentTemplate from '../components/ContentTemplate.vue'
import BlockedDomainsEditor from './BlockedDomainsEditor.vue'
import WeeklySchedulesEditor from './WeeklySchedulesEditor/index.vue'

const { port } = defineProps<{
  port: Port
}>()
</script>

<template>
  <ContentTemplate title="Blocking">
    <BCard class="mb-4 shadow-sm">
      <BlockedDomainsEditor
        :browsing-rules-storage-service="BrowsingRulesStorageService.create()"
        :port="port"
      />
    </BCard>
    <BCard class="mb-4 shadow-sm">
      <WeeklySchedulesEditor
        :weekly-schedule-storage-service="WeeklyScheduleStorageService.create()"
        :port="port"
      />
    </BCard>
  </ContentTemplate>
</template>
