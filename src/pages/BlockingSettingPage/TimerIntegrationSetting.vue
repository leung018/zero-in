<script setup lang="ts">
import { ref } from 'vue'

const disableBlockingDuringBreaks = ref(true)
</script>

<template>
  <BFormCheckbox v-model="disableBlockingDuringBreaks">
    Pause blocking during breaks
  </BFormCheckbox>
</template>
