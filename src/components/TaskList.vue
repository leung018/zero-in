<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Task } from '../domain/task'
import type { TaskService } from '@/domain/task_service'

const props = defineProps<{
  taskService: TaskService
}>()
const tasks = ref<Task[]>([])

onMounted(async () => {
  tasks.value = await props.taskService.getTasks()
})
</script>

<template>
  <div class="container mt-4">
    <h1 class="mb-4">Task List</h1>
    <form class="mb-4">
      <div class="mb-3">
        <input type="text" class="form-control" placeholder="Enter your task" required />
      </div>
      <button type="submit" class="btn btn-primary">Add Task</button>
    </form>
    <ul class="list-group">
      <li v-for="task in tasks" :key="task.id" class="list-group-item" data-test="task">
        {{ task.name }}
      </li>
    </ul>
  </div>
</template>
