<script setup lang="ts">
import { ref } from 'vue'
import type { Ref } from 'vue'
import type { Task } from '../domain/task'

const tasks: Ref<Task[]> = ref([
  { id: '1', name: 'Task 2' },
  { id: '2', name: 'Task 1' }
])
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
