<script setup lang="ts">
const { isLoading } = defineProps<{ isLoading: boolean }>()
</script>
<template>
  <div
    v-if="isLoading"
    class="d-flex justify-content-center align-items-center"
    style="height: 100px"
  >
    <span class="spinner-border"></span>
    <span class="ms-2">Loading...</span>
  </div>
  <slot v-else></slot>
</template>
