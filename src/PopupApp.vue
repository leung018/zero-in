<script setup lang="ts">
import BlockedDomains from './components/BlockedDomains.vue'
import { SiteRulesServiceImpl } from './domain/site_rules_service'
const siteRulesService = SiteRulesServiceImpl.create()
</script>

<template>
  <main>
    <BlockedDomains :siteRulesService="siteRulesService" />
  </main>
</template>
