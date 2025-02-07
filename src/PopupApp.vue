<script setup lang="ts">
import { MessengerFactory } from './chrome/messenger'
import { BrowsingRulesStorageServiceImpl } from './domain/browsing_rules/storage'
import BlockedDomainsPage from './pages/BlockedDomainsPage.vue'
</script>

<template>
  <main class="p-4">
    <BlockedDomainsPage
      :browsingRulesStorageService="BrowsingRulesStorageServiceImpl.create()"
      :sender="MessengerFactory.createMessenger()"
    />
  </main>
</template>
