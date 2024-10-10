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
  await expect(taskItems.nth(0)).toHaveText('Task 2')
  await expect(taskItems.nth(1)).toHaveText('Task 1')
})
