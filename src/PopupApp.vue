<script setup lang="ts">
import TaskList from './components/TaskList.vue'
import { ChromeLocalStorageTaskService } from './domain/task_service'
const taskService = new ChromeLocalStorageTaskService()
</script>

<template>
  <main>
    <TaskList :task-service="taskService" />
  </main>
</template>
