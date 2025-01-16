<script setup lang="ts">
import BlockedDomains from './components/BlockedDomains.vue'
import { ChromeLocalStorageSiteRulesService } from './domain/site_rules_service'
const siteRulesService = new ChromeLocalStorageSiteRulesService()
</script>

<template>
  <main>
    <BlockedDomains :siteRulesService="siteRulesService" />
  </main>
</template>
