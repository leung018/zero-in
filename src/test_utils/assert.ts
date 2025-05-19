import { DOMWrapper, VueWrapper } from '@vue/test-utils'
import { expect } from 'vitest'

export function assertSelectorInputValue(wrapper: VueWrapper, selector: string, value: string) {
  assertInputValue(wrapper.find(selector), value)
}

export function assertInputValue(input: DOMWrapper<Element>, value: string) {
  expect((input.element as HTMLInputElement).value).toBe(value)
}

export function assertSelectorCheckboxValue(wrapper: VueWrapper, selector: string, value: boolean) {
  assertCheckboxValue(wrapper.find(selector), value)
}

export function assertCheckboxValue(checkbox: DOMWrapper<Element>, value: boolean) {
  expect((checkbox.element as HTMLInputElement).checked).toBe(value)
}
