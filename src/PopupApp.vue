<script setup lang="ts">
import { ChromeRedirectService } from './chrome/redirect'
import BlockedDomainsPage from './pages/BlockedDomainsPage.vue'
import { BrowsingRulesStorageServiceImpl } from './domain/browsing_rules/storage'
import { BLOCKED_TEMPLATE_URL } from './config'
const browsingRulesStorageService = BrowsingRulesStorageServiceImpl.create()
const websiteRedirectService = new ChromeRedirectService()
</script>

<template>
  <main class="p-4">
    <BlockedDomainsPage
      :browsingRulesStorageService="browsingRulesStorageService"
      :websiteRedirectService="websiteRedirectService"
      :targetRedirectUrl="BLOCKED_TEMPLATE_URL"
    />
  </main>
</template>
