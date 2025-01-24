<script setup lang="ts">
import { ChromeRedirectService } from './chrome/redirect'
import BlockedDomainsPage from './pages/BlockedDomainsPage.vue'
import { BrowsingRulesStorageServiceImpl } from './domain/browsing_rules/storage'
const browsingRulesStorageService = BrowsingRulesStorageServiceImpl.create()
const websiteRedirectService = new ChromeRedirectService()

declare const chrome: any // FIXME: See other comments related to declare const chrome: any
const targetRedirectUrl = chrome.runtime.getURL('options.html')
</script>

<template>
  <main>
    <BlockedDomainsPage
      :browsingRulesStorageService="browsingRulesStorageService"
      :websiteRedirectService="websiteRedirectService"
      :targetRedirectUrl="targetRedirectUrl"
    />
  </main>
</template>
