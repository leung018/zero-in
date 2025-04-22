<script setup lang="ts">
import { ref } from 'vue'

const disableBlockingDuringBreaks = ref(true)
</script>

<template>
  <h2 class="mb-3 mt-3">Timer Integration</h2>
  <BFormCheckbox v-model="disableBlockingDuringBreaks">
    Pause blocking during breaks
  </BFormCheckbox>
</template>
