<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Task } from '../domain/task'
import type { TaskService } from '@/domain/task_service'

const props = defineProps<{
  taskService: TaskService
}>()
const tasks = ref<Task[]>([])
const newTaskName = ref<string>('')

onMounted(async () => {
  await syncTasks()
})

async function syncTasks() {
  tasks.value = await props.taskService.getTasks()
}

async function addTask() {
  if (!newTaskName.value) return
  await props.taskService.createTask({ name: newTaskName.value })
  newTaskName.value = ''
  await syncTasks()
}
</script>

<template>
  <div class="container mt-4">
    <h1 class="mb-4">Task List</h1>
    <!--If you trigger addTask in button @click, it will display the form validation message improperly after addTask-->
    <form class="mb-4" @submit.prevent="addTask">
      <div class="mb-3">
        <input
          v-model="newTaskName"
          type="text"
          class="form-control"
          placeholder="Enter your task"
          required
          data-test="task-name-input"
        />
      </div>
      <button class="btn btn-primary" data-test="add-task-button" type="submit">Add Task</button>
    </form>
    <ul class="list-group">
      <li v-for="task in tasks" :key="task.id" class="list-group-item" data-test="task-items">
        {{ task.name }}
      </li>
    </ul>
  </div>
</template>
