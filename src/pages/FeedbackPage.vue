<script setup lang="ts">
import ContentTemplate from '@/pages/components/ContentTemplate.vue'
</script>

<template>
  <ContentTemplate title="Feedback">
    <BCard class="mb-4 shadow-sm">
      <h3 class="mb-3 mt-1">Get in Touch</h3>
      <p>
        Have feedback or found a bug? I'd love to hear from you! Reach out through any of these
        channels:
      </p>

      <div class="d-flex gap-3 mt-1">
        <a href="https://instagram.com/zero.in.app" target="_blank" class="text-decoration-none">
          <IMdiInstagram class="me-1" /> <span class="small">Instagram</span>
        </a>
        <a
          href="https://www.facebook.com/profile.php?id=61576798744679"
          target="_blank"
          class="text-decoration-none"
        >
          <IMdiFacebook class="me-1" /> <span class="small">Facebook</span>
        </a>
        <a href="https://x.com/zero_in_app" target="_blank" class="text-decoration-none">
          <IPrimeTwitter class="me-1" /> <span class="small">X</span>
        </a>
        <a
          href="https://github.com/leung018/zero-in/issues"
          target="_blank"
          class="text-decoration-none"
        >
          <IMdiGithub class="me-1" /> <span class="small">GitHub</span>
        </a>
        <a href="mailto:leung-cheng@outlook.com" class="text-decoration-none">
          <IMdiEmail class="me-1" /> <span class="small">Email</span>
        </a>
      </div>
    </BCard>

    <BCard class="mb-4 shadow-sm">
      <h3 class="mb-3 mt-1">Support</h3>
      <p>
        If you find this extension helpful in your productivity journey, consider supporting with a
        coffee!
      </p>
      <a href="https://ko-fi.com/R6R21FK21S" target="_blank" class="d-inline-block">
        <img
          height="36"
          style="border: 0px; height: 36px"
          src="https://storage.ko-fi.com/cdn/kofi6.png?v=6"
          border="0"
          alt="Buy Me a Coffee at ko-fi.com"
        />
      </a>
    </BCard>
  </ContentTemplate>
</template>
