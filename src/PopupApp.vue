<script setup lang="ts">
import BlockedDomains from './components/BlockedDomains.vue'
import { SiteRulesStorageServiceImpl } from './domain/site_rules_storage'
const siteRulesStorageService = SiteRulesStorageServiceImpl.create()
</script>

<template>
  <main>
    <BlockedDomains :siteRulesStorageService="siteRulesStorageService" />
  </main>
</template>
