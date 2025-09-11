<script setup lang="ts">
import { ImportStatus } from '@/domain/import/record'
import { ref } from 'vue'
import { ImportRecordStorageService } from '../domain/import/record/storage'
import { SettingsExistenceService } from '../domain/import/settings_existence'

const {
  localSettingsExistenceService,
  remoteSettingsExistenceService,
  importRecordStorageService
} = defineProps<{
  localSettingsExistenceService: SettingsExistenceService
  remoteSettingsExistenceService: SettingsExistenceService
  importRecordStorageService: ImportRecordStorageService
}>()

enum ProcessState {
  INITIAL,
  IMPORT_PROMPT
}

const state = ref(ProcessState.INITIAL)

defineExpose({
  triggerHelperProcess: async () => {
    const importRecord = await importRecordStorageService.get()
    if (importRecord.status === ImportStatus.IMPORTED) {
      return
    }

    const hasLocalData = await localSettingsExistenceService.hasSettings()
    if (hasLocalData) {
      if (
        importRecord.status === ImportStatus.NOT_STARTED ||
        !(await remoteSettingsExistenceService.hasSettings())
      ) {
        state.value = ProcessState.IMPORT_PROMPT
      }
    }
  }
})
</script>

<template>
  <div class="signin-container processing-message">
    <div class="spinner-border text-primary mb-3"></div>

    <div data-test="sign-in-initial-message" v-if="state === ProcessState.INITIAL">
      <h4 class="mb-2">Signing you in...</h4>
      <p class="text-muted">
        Please don't close this page. We're securely connecting your account now.
      </p>
    </div>

    <div data-test="import-prompt" v-if="state === ProcessState.IMPORT_PROMPT">
      <h4 class="mb-2">Would you like to import settings from existing device?</h4>
      <p class="text-muted mb-4">
        Importing will replace any existing account settings. You can import them or start fresh.
      </p>
      <div class="button-group">
        <button class="btn btn-primary me-2">Import</button>
        <button class="btn btn-secondary">Skip</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.processing-message {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 50px;
}

.spinner-border {
  display: inline-block;
  width: 2rem;
  height: 2rem;
  vertical-align: -0.125em;
  border: 0.25em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  -webkit-animation: 0.75s linear infinite spinner-border;
  animation: 0.75s linear infinite spinner-border;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}
</style>
