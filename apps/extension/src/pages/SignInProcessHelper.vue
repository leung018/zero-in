<script setup lang="ts">
import { ImportRecord, ImportStatus } from '@/domain/import/record'
import { ref } from 'vue'
import { ImportRecordStorageService } from '../domain/import/record/storage'
import { ImportService } from '../domain/import/service'
import { SettingsExistenceService } from '../domain/import/settings-existence'
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
  <div class="text-center py-5">
    <div class="spinner-border text-primary mb-4"></div>

    <div data-test="sign-in-initial-message" v-if="state === ProcessState.INITIAL">
      <h4 class="mb-4">Signing you in...</h4>
    </div>

    <div
      data-test="import-prompt"
      v-if="state === ProcessState.IMPORT_PROMPT"
      class="mx-auto import-prompt"
    >
      <div class="card shadow-sm mb-4">
        <div class="card-body p-4">
          <h4 class="card-title mb-3">Import settings from this device?</h4>
          <p class="card-text text-muted mb-4">
            Importing will replace any existing account settings. You can import them or start
            fresh.
          </p>
          <div class="d-flex gap-2 justify-content-center">
            <button class="btn btn-primary" data-test="import-button" @click="onClickImport">
              Import
            </button>
            <button class="btn btn-secondary" data-test="skip-button" @click="onClickSkip">
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="mx-auto hint-box">
      <div class="fw-bold mb-2">⚠️ Please keep this page open</div>
      <div class="text-muted small">
        Don't close this page while we connect your account. If nothing happens after a few moments,
        refresh to try again.
      </div>
    </div>
  </div>
</template>

<style scoped>
.spinner-border {
  width: 2.5rem;
  height: 2.5rem;
}

.import-prompt {
  max-width: 500px;
}

.hint-box {
  max-width: 500px;
  background: #fff3cd;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border-left: 3px solid #ffc107;
  color: #664d03;
}
</style>
