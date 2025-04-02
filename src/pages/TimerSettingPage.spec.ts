import { describe, expect, it } from 'vitest'
import { TimerConfig } from '../domain/pomodoro/config'
import { startBackgroundListener } from '../test_utils/listener'
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import TimerSettingPage from './TimerSettingPage.vue'
import { Duration } from '../domain/pomodoro/duration'

describe('TimerSettingPage', () => {
  it('should render timer config properly', async () => {
    const { wrapper } = await mountPage(
      new TimerConfig({
        focusDuration: new Duration({ minutes: 24 }),
        shortBreakDuration: new Duration({ minutes: 4 }),
        longBreakDuration: new Duration({ minutes: 13 }),
        focusSessionsPerCycle: 3
      })
    )
    await flushPromises()

    assertInputValue(wrapper, 'focus-duration', '24')
    assertInputValue(wrapper, 'short-break-duration', '4')
    assertInputValue(wrapper, 'long-break-duration', '13')
    assertInputValue(wrapper, 'focus-sessions-per-cycle', '3')
  })

  it('should check perform cycle, show short break and focus sessions per cycle when focus sessions per cycles higher than 1', async () => {
    const { wrapper } = await mountPage(
      TimerConfig.newTestInstance({
        focusSessionsPerCycle: 2
      })
    )
    await flushPromises()

    assertCheckboxValue(wrapper, 'perform-cycle', true)
    expect(wrapper.find('[data-test="short-break-duration"]').isVisible()).toBe(true)
    expect(wrapper.find('[data-test="focus-sessions-per-cycle"]').isVisible()).toBe(true)
  })

  it('should uncheck perform cycle, hide short break and focus sessions per cycle when focus sessions per cycles equal to 1', async () => {
    const { wrapper } = await mountPage(
      TimerConfig.newTestInstance({
        focusSessionsPerCycle: 1
      })
    )
    await flushPromises()

    assertCheckboxValue(wrapper, 'perform-cycle', false)
    expect(wrapper.find('[data-test="short-break-duration"]').isVisible()).toBe(false)
    expect(wrapper.find('[data-test="focus-sessions-per-cycle"]').isVisible()).toBe(false)
  })
})

async function mountPage(initialTimerConfig: TimerConfig) {
  const { timerConfigStorageService, timer, communicationManager } = await startBackgroundListener({
    timerConfig: initialTimerConfig
  })
  const wrapper = await mount(TimerSettingPage, {
    props: {
      timerConfigStorageService
    }
  })
  return { timerConfigStorageService, timer, wrapper, communicationManager }
}

function assertInputValue(wrapper: VueWrapper, dataTest: string, value: string) {
  const input = wrapper.find(`[data-test="${dataTest}"]`).element as HTMLInputElement
  expect(input.value).toBe(value)
}

function assertCheckboxValue(wrapper: VueWrapper, dataTest: string, value: boolean) {
  const checkbox = wrapper.find(`[data-test="${dataTest}"]`).element as HTMLInputElement
  expect(checkbox.checked).toBe(value)
}
