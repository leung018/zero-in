<script setup lang="ts">
import type { Port } from '@/infra/communication'
import { BrowsingRulesStorageService } from '@/domain/browsing_rules/storage'
import { WeeklyScheduleStorageService } from '@/domain/schedules/storage'
import ContentTemplate from '../components/ContentTemplate.vue'
import BlockedDomainsEditor from './BlockedDomainsEditor.vue'
import WeeklySchedulesEditor from './WeeklySchedulesEditor/index.vue'
import { ref } from 'vue'

const { port } = defineProps<{
  port: Port
}>()

const disableBlockingDuringBreaks = ref(true)
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
      <h2 class="mb-3 mt-3">Timer Integration</h2>
      <BFormCheckbox v-model="disableBlockingDuringBreaks">
        Pause blocking during breaks
      </BFormCheckbox>
    </BCard>
    <BCard class="mb-4 shadow-sm">
      <WeeklySchedulesEditor
        :weekly-schedule-storage-service="WeeklyScheduleStorageService.create()"
        :port="port"
      />
    </BCard>
  </ContentTemplate>
</template>
