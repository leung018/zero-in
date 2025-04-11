<script setup lang="ts">
import type { NotificationSettingStorageService } from '@/domain/notification_setting/storage'
import ContentTemplate from './components/ContentTemplate.vue'
import { onBeforeMount, ref } from 'vue'

const { notificationSettingStorageService } = defineProps<{
  notificationSettingStorageService: NotificationSettingStorageService
}>()
const reminderTab = ref(false)
const desktopNotification = ref(false)
const sound = ref(false)

onBeforeMount(async () => {
  const setting = await notificationSettingStorageService.get()
  reminderTab.value = setting.reminderTab
  desktopNotification.value = setting.desktopNotification
  sound.value = setting.sound
})
</script>

<template>
  <ContentTemplate title="Notification">
    <p class="mb-3">
      <small>Configure how you want to be notified when a timer completes.</small>
    </p>

    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title mb-3">When time's up:</h5>

        <BFormCheckbox data-test="reminder-tab-option" class="mb-3" v-model="reminderTab">
          Open reminder tab
        </BFormCheckbox>

        <BFormCheckbox
          data-test="desktop-notification-option"
          class="mb-3"
          v-model="desktopNotification"
        >
          Show desktop notification
        </BFormCheckbox>

        <BFormCheckbox data-test="sound-option" class="mb-3" v-model="sound">
          Play sound
        </BFormCheckbox>
      </div>
    </div>

    <BButton variant="primary" data-test="save-button"> Save </BButton>
  </ContentTemplate>
</template>
