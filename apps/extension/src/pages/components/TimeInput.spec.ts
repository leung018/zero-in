import { VueWrapper, mount } from '@vue/test-utils'
import { Time } from '@zero-in/shared/domain/time/index'
import { describe, expect, it } from 'vitest'
import { assertInputValue } from '../../test-utils/assert'
import TimerInput from './TimeInput.vue'

describe('TimerInput', () => {
  it('should display time according to modelValue', () => {
    const { inputWrapper } = mountTimerInput({ modelValue: new Time(0, 1) })
    expect(inputWrapper.element.value).toBe('00:01')

    const { inputWrapper: inputWrapper2 } = mountTimerInput({ modelValue: new Time(1, 0) })
    expect(inputWrapper2.element.value).toBe('01:00')
  })

  it('should update in input element change modelValue', async () => {
    const { inputWrapper: input, rootWrapper } = mountTimerInput({ modelValue: new Time(0, 0) })

    await input.setValue('12:34')
    expect(getLastEmittedModelValue(rootWrapper)).toEqual(new Time(12, 34))

    await input.setValue('00:09')
    expect(getLastEmittedModelValue(rootWrapper)).toEqual(new Time(0, 9))
  })

  it('should remove input will reset to 00:00', async () => {
    const { inputWrapper: input, rootWrapper } = mountTimerInput({ modelValue: new Time(12, 59) })

    await input.setValue('')

    expect(getLastEmittedModelValue(rootWrapper)).toEqual(new Time(0, 0))
    assertInputValue(input, '00:00')
  })

  it('should update input display when modelValue changes', async () => {
    const { rootWrapper, inputWrapper } = mountTimerInput({ modelValue: new Time(9, 30) })

    await rootWrapper.setProps({
      modelValue: new Time(14, 45)
    })

    assertInputValue(inputWrapper, '14:45')
  })
})

function mountTimerInput({ modelValue = new Time(0, 0) } = {}) {
  const rootWrapper = mount(TimerInput, {
    props: {
      modelValue,
      dataTest: 'input'
    },
    emits: ['update:modelValue']
  })

  return {
    rootWrapper,
    inputWrapper: rootWrapper.find('input')
  }
}

function getLastEmittedModelValue(wrapper: VueWrapper): Time | null {
  const updateModelEvent = wrapper.emitted('update:modelValue')
  if (!updateModelEvent) {
    return null
  }
  return updateModelEvent[updateModelEvent.length - 1][0] as Time
}
