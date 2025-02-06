<script setup lang="ts">
import { ChromeMessenger } from './chrome/messenger'
import { BrowsingRulesStorageServiceImpl } from './domain/browsing_rules/storage'
import BlockedDomainsPage from './pages/BlockedDomainsPage.vue'
</script>

<template>
  <main class="p-4">
    <BlockedDomainsPage
      :browsingRulesStorageService="BrowsingRulesStorageServiceImpl.create()"
      :chromeMessenger="ChromeMessenger.create()"
    />
  </main>
</template>
