import { test, expect } from './fixtures.js'

test('should able to add tasks and display them', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`)

  const addTaskInput = page.getByTestId('task-name-input')
  const addTaskButton = page.getByTestId('add-task-button')

  await addTaskInput.fill('Task 1')
  await addTaskButton.click()

  await addTaskInput.fill('Task 2')
  await addTaskButton.click()

  const taskItems = page.getByTestId('task-items')
  const task2 = taskItems.nth(0)
  const task1 = taskItems.nth(1)

  await expect(task2).toHaveText('Task 2')
  await expect(task1).toHaveText('Task 1')
})
