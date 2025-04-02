import { expect } from 'vitest'
import { VueWrapper } from '@vue/test-utils'

export function assertInputValue(wrapper: VueWrapper, selector: string, value: string) {
  const input = wrapper.find(selector).element as HTMLInputElement
  expect(input.value).toBe(value)
}

export function assertCheckboxValue(wrapper: VueWrapper, selector: string, value: boolean) {
  const checkbox = wrapper.find(selector).element as HTMLInputElement
  expect(checkbox.checked).toBe(value)
}
