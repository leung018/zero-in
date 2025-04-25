import { expect } from 'vitest'
import { DOMWrapper, VueWrapper } from '@vue/test-utils'

export function assertInputValue(wrapper: VueWrapper, selector: string, value: string) {
  assertIsValue(wrapper.find(selector), value)
}

export function assertIsValue(input: DOMWrapper<Element>, value: string) {
  expect((input.element as HTMLInputElement).value).toBe(value)
}

export function assertCheckboxValue(wrapper: VueWrapper, selector: string, value: boolean) {
  assertIsChecked(wrapper.find(selector), value)
}

export function assertIsChecked(checkbox: DOMWrapper<Element>, value: boolean) {
  expect((checkbox.element as HTMLInputElement).checked).toBe(value)
}
