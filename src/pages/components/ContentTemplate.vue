<script setup lang="ts">
const { title } = defineProps<{
  title: string
}>()
</script>

<template>
  <div class="container">
    <h1 class="mb-4 mt-4">{{ title }}</h1>
    <slot></slot>
  </div>
</template>

<style scoped>
.container {
  max-width: 500px;
}
</style>
