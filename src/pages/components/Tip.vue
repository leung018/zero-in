<script setup lang="ts">
const { msg } = defineProps<{ msg: string }>()
</script>

<template>
  <div>
    <IIcOutlineTipsAndUpdates v-b-toggle.tip type="button" />
    <BCollapse id="tip">
      <div class="bg-secondary text-light p-2 mt-2">
        {{ msg }}
      </div>
    </BCollapse>
  </div>
</template>
