import { describe, it, expect } from 'vitest'

import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import TaskList from '../TaskList.vue'
import { InMemoryTaskStorageService, type TaskService } from '../../domain/task_service'
import type { TaskContent } from '../../domain/task'

describe('TaskList', () => {
  it('should render tasks in the reverse order of creation', async () => {
    const taskService = new InMemoryTaskStorageService()
    await taskService.createTask({ name: 'Task 1' })
    await taskService.createTask({ name: 'Task 2' })

    const { wrapper } = mountTaskList(taskService)
    await flushPromises()

    const taskItems = wrapper.findAll("[data-test='task-item']")

    const task1 = taskItems.find((item) => item.text().includes('Task 1'))
    const task2 = taskItems.find((item) => item.text().includes('Task 2'))

    if (!task1 || !task2) {
      throw new Error('Task items not found')
    }

    const position = task1.element.compareDocumentPosition(task2.element)
    expect(position).toBe(Node.DOCUMENT_POSITION_PRECEDING)
  })

  it('should able to add new task', async () => {
    const { wrapper, taskService } = mountTaskList()

    await addTask(wrapper, { name: 'New Task' })

    const taskItems = wrapper.findAll("[data-test='task-item']")
    const newTask = taskItems.find((item) => item.text().includes('New Task'))
    expect(newTask).toBeTruthy()

    const tasks = await taskService.getTasks()
    expect(tasks.length).toBe(1)
    expect(tasks[0].name).toBe('New Task')
  })

  it('should clear task name input after adding new task', async () => {
    const { wrapper } = mountTaskList()
    await addTask(wrapper)

    const inputElement = wrapper.find("[data-test='task-name-input']").element as HTMLInputElement
    expect(inputElement.value).toBe('')
  })

  it('should not add task with empty name', async () => {
    const { wrapper, taskService } = mountTaskList()

    await addTask(wrapper, { name: '' })

    const taskItems = wrapper.findAll("[data-test='task-item']")
    expect(taskItems.length).toBe(0)

    const tasks = await taskService.getTasks()
    expect(tasks.length).toBe(0)
  })

  function mountTaskList(taskService: TaskService = new InMemoryTaskStorageService()) {
    const wrapper = mount(TaskList, {
      props: { taskService }
    })
    return {
      taskService,
      wrapper
    }
  }

  async function addTask(wrapper: VueWrapper, taskContent: TaskContent = { name: 'Dummy name' }) {
    const taskNameInput = wrapper.find("[data-test='task-name-input']")
    taskNameInput.setValue(taskContent.name)

    const addButton = wrapper.find("[data-test='add-task-button']")
    await addButton.trigger('click')
  }
})
