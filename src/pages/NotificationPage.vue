<script setup lang="ts">
import ContentTemplate from './components/ContentTemplate.vue'
</script>

<template>
  <ContentTemplate title="Notification">
    <p class="mb-3">
      <small>Configure how you want to be notified when a timer completes.</small>
    </p>

    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title mb-3">When time's up:</h5>

        <BFormCheckbox data-test="new-tab-option" class="mb-3"> Open reminder page </BFormCheckbox>

        <BFormCheckbox data-test="desktop-notification-option" class="mb-3">
          Show desktop notification
        </BFormCheckbox>

        <BFormCheckbox data-test="sound-option" class="mb-3"> Play sound </BFormCheckbox>
      </div>
    </div>

    <BButton variant="primary" data-test="save-button"> Save </BButton>
  </ContentTemplate>
</template>
