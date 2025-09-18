<script setup lang="ts">
import ContentTemplate from '@/pages/components/ContentTemplate.vue'
</script>

<template>
  <ContentTemplate title="About">
    <BCard class="mb-4 shadow-sm">
      <h3 class="mt-1 mb-2">Policies</h3>
      <p class="text-muted mb-3">
        For more details on our policies, please review the links below.
      </p>
      <div class="d-flex flex-column gap-2">
        <BLink href="https://zeroin.dev/tos" target="_blank" class="text-decoration-none fw-medium">
          Terms of Service
        </BLink>
        <BLink
          href="https://zeroin.dev/privacy"
          target="_blank"
          class="text-decoration-none fw-medium"
        >
          Privacy Policy
        </BLink>
      </div>
    </BCard>

    <BCard class="mb-4 shadow-sm">
      <h3 class="mt-1 mb-2">Credits</h3>
      <p class="text-muted mb-3">This application uses various open-source libraries.</p>
      <div class="d-flex flex-column gap-2">
        <BLink
          href="https://github.com/leung018/zero-in/blob/main/THIRD_PARTY_LICENSES.md"
          target="_blank"
          class="text-decoration-none fw-medium"
        >
          View Licenses
        </BLink>
      </div>
    </BCard>
  </ContentTemplate>
</template>
