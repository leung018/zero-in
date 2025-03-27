import { describe, expect, it } from 'vitest'
import { startBackgroundListener } from '../test_utils/listener'
import { PomodoroTimerConfig } from '../domain/pomodoro/config'
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import TestingConfigPage from './TestingConfigPage.vue'
import { Duration } from '../domain/pomodoro/duration'

describe('TestingConfigPage', () => {
  it('should render timer config', async () => {
    const { wrapper } = await mountPage(
      new PomodoroTimerConfig({
        focusDuration: new Duration({ seconds: 24 }),
        shortBreakDuration: new Duration({ seconds: 4 }),
        longBreakDuration: new Duration({ seconds: 14 }),
        numOfPomodoriPerCycle: 3,
        pomodoroRecordHouseKeepDays: 99
      })
    )
    await flushPromises()

    assertInputValue(wrapper, 'focus-duration', '24')
    assertInputValue(wrapper, 'short-break-duration', '4')
    assertInputValue(wrapper, 'long-break-duration', '14')
    assertInputValue(wrapper, 'num-of-pomodori-per-cycle', '3')
    assertInputValue(wrapper, 'pomodoro-record-house-keep-days', '99')
  })
})

async function mountPage(initialTimerConfig: PomodoroTimerConfig) {
  const { timerConfigStorageService } = await startBackgroundListener({
    timerConfig: initialTimerConfig
  })
  const wrapper = mount(TestingConfigPage, {
    props: {
      timerConfigStorageService
    }
  })
  return { timerConfigStorageService, wrapper }
}

function assertInputValue(wrapper: VueWrapper, dataTest: string, value: string) {
  const input = wrapper.find(`[data-test="${dataTest}"]`).element as HTMLInputElement
  expect(input.value).toBe(value)
}
