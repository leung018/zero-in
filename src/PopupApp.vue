<script setup lang="ts">
import TaskList from './components/TaskList.vue'
import { InMemoryTaskStorageService } from './domain/task_service'
const taskService = new InMemoryTaskStorageService()
</script>

<template>
  <main>
    <TaskList :task-service="taskService" />
  </main>
</template>
