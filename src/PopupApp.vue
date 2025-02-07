<script setup lang="ts">
import { MessengerFactory } from './chrome/messenger'
import { BrowsingRulesStorageService } from './domain/browsing_rules/storage'
import BlockedDomainsPage from './pages/BlockedDomainsPage.vue'
</script>

<template>
  <main class="p-4">
    <BlockedDomainsPage
      :browsingRulesStorageService="BrowsingRulesStorageService.create()"
      :sender="MessengerFactory.createMessenger()"
    />
  </main>
</template>
