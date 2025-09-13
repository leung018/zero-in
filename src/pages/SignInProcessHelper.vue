<script setup lang="ts">
import { ImportRecord, ImportStatus } from '@/domain/import/record'
import { ref } from 'vue'
import { ImportRecordStorageService } from '../domain/import/record/storage'
import { ImportService } from '../domain/import/service'
import { SettingsExistenceService } from '../domain/import/settings_existence'
import { StorageInterface } from '../infra/storage/interface'

const { localStorage, remoteStorage, importRecordStorageService } = defineProps<{
  localStorage: StorageInterface
  remoteStorage: StorageInterface
  importRecordStorageService: ImportRecordStorageService
}>()

const localSettingsExistenceService = SettingsExistenceService.create(localStorage)
const remoteSettingsExistenceService = SettingsExistenceService.create(remoteStorage)

const importService = new ImportService({
  localStorage,
  remoteStorage
})

enum ProcessState {
  INITIAL,
  IMPORT_PROMPT
}

const state = ref(ProcessState.INITIAL)

async function shouldShowImportPrompt() {
  const importRecord = await importRecordStorageService.get()
  if (importRecord.status === ImportStatus.IMPORTED) {
    return false
  }

  const hasLocalData = await localSettingsExistenceService.hasSettings()
  if (!hasLocalData) {
    return false
  }

  const hasRemoteData = await remoteSettingsExistenceService.hasSettings()
  if (!hasRemoteData || importRecord.status === ImportStatus.NOT_STARTED) {
    return true
  }

  return false
}

defineExpose({
  triggerHelperProcess: async () => {
    if (await shouldShowImportPrompt()) {
      state.value = ProcessState.IMPORT_PROMPT
      return
    }
    emit('onHelperProcessComplete')
  }
})

const emit = defineEmits(['onHelperProcessComplete'])

const onClickImport = async () => {
  await importService.importFromLocalToRemote()
  await recordImportStatus(ImportStatus.IMPORTED)
  emit('onHelperProcessComplete')
}

const onClickSkip = async () => {
  await recordImportStatus(ImportStatus.USER_SKIPPED)
  emit('onHelperProcessComplete')
}

async function recordImportStatus(status: ImportStatus) {
  const newImportRecord: ImportRecord = {
    status
  }
  await importRecordStorageService.save(newImportRecord)
}
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
        <button class="btn btn-primary me-2" data-test="import-button" @click="onClickImport">
          Import
        </button>
        <button class="btn btn-secondary" data-test="skip-button" @click="onClickSkip">Skip</button>
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
