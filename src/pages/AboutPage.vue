<script setup lang="ts">
import ContentTemplate from '@/pages/components/ContentTemplate.vue'
</script>

<template>
  <ContentTemplate title="About">
    <BCard class="mb-4 shadow-sm">
      <h3 class="mt-1 mb-3">Policies</h3>
      <p>For more details on our policies, please review the links below.</p>
      <div class="d-flex flex-column gap-2">
        <BLink
          href="https://zeroin.dev/tos"
          target="_blank"
          rel="noopener"
          class="text-decoration-none fw-medium"
        >
          Terms of Service
        </BLink>
        <BLink
          href="https://zeroin.dev/privacy"
          target="_blank"
          rel="noopener"
          class="text-decoration-none fw-medium"
        >
          Privacy Policy
        </BLink>
      </div>
    </BCard>

    <BCard class="mb-4 shadow-sm">
      <h3 class="mt-1 mb-3">Credits</h3>
      <p>This application uses various open-source libraries.</p>
      <div class="d-flex flex-column gap-2">
        <BLink
          href="https://github.com/leung018/zero-in/blob/main/THIRD_PARTY_LICENSES.md"
          target="_blank"
          rel="noopener"
          class="text-decoration-none fw-medium"
        >
          View Licenses
        </BLink>
      </div>
    </BCard>

    <BCard class="mb-4 shadow-sm">
      <h3 class="mt-1 mb-3">Home Page</h3>
      <BLink
        href="https://zeroin.dev"
        target="_blank"
        rel="noopener"
        class="text-decoration-none fw-medium"
      >
        Visit Our Website
      </BLink>
    </BCard>
  </ContentTemplate>
</template>
