import { expect } from 'vitest'
import { DOMWrapper, VueWrapper } from '@vue/test-utils'

export function assertInputValue(wrapper: VueWrapper, selector: string, value: string) {
  const input = wrapper.find(selector).element as HTMLInputElement
  expect(input.value).toBe(value)
}

export function assertCheckboxValue(wrapper: VueWrapper, selector: string, value: boolean) {
  const checkbox = wrapper.find(selector)
  assertIsChecked(checkbox, value)
}

export function assertIsChecked(checkbox: DOMWrapper<Element>, value: boolean) {
  const checked = (checkbox.element as HTMLInputElement).checked
  expect(checked).toBe(value)
}
