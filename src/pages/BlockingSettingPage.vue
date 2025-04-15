<script setup lang="ts">
import type { Port } from '@/infra/communication'
import { BrowsingRulesStorageService } from '../domain/browsing_rules/storage'
import { WeeklyScheduleStorageService } from '../domain/schedules/storage'
import ContentTemplate from './components/ContentTemplate.vue'
import BlockedDomainsPage from './BlockedDomainsPage.vue'
import WeeklySchedulesPage from './WeeklySchedulesPage/index.vue'

const { port } = defineProps<{
  port: Port
}>()
</script>

<template>
  <ContentTemplate title="Blocking">
    <BCard class="mb-4 shadow-sm">
      <BlockedDomainsPage
        :browsing-rules-storage-service="BrowsingRulesStorageService.create()"
        :port="port"
      />
    </BCard>
    <BCard class="mb-4 shadow-sm">
      <WeeklySchedulesPage
        :weekly-schedule-storage-service="WeeklyScheduleStorageService.create()"
        :port="port"
      />
    </BCard>
  </ContentTemplate>
</template>
