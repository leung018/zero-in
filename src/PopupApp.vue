<script setup lang="ts">
import { RedirectTogglingService } from './domain/redirect_toggling'
import BlockedDomainsPage from './pages/BlockedDomainsPage.vue'
const redirectTogglingService = RedirectTogglingService.create()
</script>

<template>
  <main class="p-4">
    <BlockedDomainsPage :redirectTogglingService="redirectTogglingService" />
  </main>
</template>
