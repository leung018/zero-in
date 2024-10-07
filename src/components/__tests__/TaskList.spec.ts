import { describe, it, expect } from 'vitest'

import { flushPromises, mount } from '@vue/test-utils'
import TaskList from '../TaskList.vue'
import { InMemoryTaskStorageService } from '../../domain/task_service'

describe('TaskList', () => {
  it('should render tasks in the reverse order of creation', async () => {
    const taskService = new InMemoryTaskStorageService()
    await taskService.createTask({ name: 'Task 1' })
    await taskService.createTask({ name: 'Task 2' })

    const wrapper = mount(TaskList, {
      props: { taskService }
    })
    await flushPromises()

    const taskItems = wrapper.findAll("[data-test='task']")

    const task1 = taskItems.find((item) => item.text().includes('Task 1'))
    const task2 = taskItems.find((item) => item.text().includes('Task 2'))

    if (!task1 || !task2) {
      throw new Error('Task items not found')
    }

    const position = task1.element.compareDocumentPosition(task2.element)
    expect(position).toBe(Node.DOCUMENT_POSITION_PRECEDING)
  })

  it('should able to add new task', async () => {
    const taskService = new InMemoryTaskStorageService()
    const wrapper = mount(TaskList, {
      props: { taskService }
    })

    const taskInput = wrapper.find("[data-test='task-name-input']")
    taskInput.setValue('New Task')

    const addButton = wrapper.find("[data-test='add-task-button']")
    await addButton.trigger('click')

    const taskItems = wrapper.findAll("[data-test='task']")
    const newTask = taskItems.find((item) => item.text().includes('New Task'))
    expect(newTask).toBeTruthy()

    const tasks = await taskService.getTasks()
    expect(tasks.length).toBe(1)
    expect(tasks[0].name).toBe('New Task')
  })
})
