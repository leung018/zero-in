<script setup lang="ts">
import { WebsiteRedirectServiceImpl } from './chrome/redirect'
import BlockedDomains from './components/BlockedDomains.vue'
import { SiteRulesStorageServiceImpl } from './domain/site_rules_storage'
const siteRulesStorageService = SiteRulesStorageServiceImpl.create()
const websiteRedirectService = new WebsiteRedirectServiceImpl()

declare const chrome: any // FIXME: See other comments related to declare const chrome: any
const targetRedirectUrl = chrome.runtime.getURL('options.html')
</script>

<template>
  <main>
    <BlockedDomains
      :siteRulesStorageService="siteRulesStorageService"
      :websiteRedirectService="websiteRedirectService"
      :targetRedirectUrl="targetRedirectUrl"
    />
  </main>
</template>
