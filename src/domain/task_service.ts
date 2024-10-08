import { v4 as uuidv4 } from 'uuid'
import type { Task, TaskContent } from './task'

export interface TaskService {
  /**
   * Gets tasks with the most recently created ones first.
   */
  getTasks(): Promise<Task[]>

  createTask(TaskContent: TaskContent): Promise<Task>
}

export class InMemoryTaskStorageService implements TaskService {
  private tasks: Task[] = []

  async getTasks(): Promise<Task[]> {
    return this.tasks
  }

  async createTask(taskContent: TaskContent): Promise<Task> {
    const task: Task = {
      id: uuidv4(),
      ...taskContent
    }
    this.tasks.unshift(task)
    return task
  }
}
