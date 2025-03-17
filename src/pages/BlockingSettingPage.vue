<script setup lang="ts">
import type { BrowsingRulesStorageService } from '../domain/browsing_rules/storage'
import type { Port } from '../infra/communication'
import ContentTemplate from './components/ContentTemplate.vue'
import BlockedDomainsEditor from './components/BlockedDomainsEditor.vue'
import WeeklySchedulesEditor from './components/WeeklySchedulesEditor/index.vue'
import type { WeeklyScheduleStorageService } from '../domain/schedules/storage'

const { port, browsingRulesStorageService, weeklyScheduleStorageService } = defineProps<{
  port: Port
  browsingRulesStorageService: BrowsingRulesStorageService
  weeklyScheduleStorageService: WeeklyScheduleStorageService
}>()
</script>

<template>
  <ContentTemplate title="Blocking">
    <BlockedDomainsEditor :port="port" :browsingRulesStorageService="browsingRulesStorageService" />
    <WeeklySchedulesEditor
      class="mt-4"
      :port="port"
      :weeklyScheduleStorageService="weeklyScheduleStorageService"
    />
  </ContentTemplate>
</template>
