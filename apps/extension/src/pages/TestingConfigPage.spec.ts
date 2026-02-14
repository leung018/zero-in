import { flushPromises, mount } from '@vue/test-utils'
import { Duration } from '@zero-in/shared/domain/timer/duration'
import { describe, expect, it } from 'vitest'
import { TimerConfig } from '../domain/timer/config'
import { assertSelectorInputValue } from '../test-utils/assert'
import { setUpListener } from '../test-utils/listener'
import { dataTestSelector } from '../test-utils/selector'
import TestingConfigPage from './TestingConfigPage.vue'

describe('TestingConfigPage', () => {
  it('should render timer config', async () => {
    const { wrapper } = await mountPage(
      new TimerConfig({
        focusDuration: new Duration({ seconds: 24 }),
        shortBreakDuration: new Duration({ seconds: 4 }),
        longBreakDuration: new Duration({ seconds: 14 }),
        focusSessionsPerCycle: 3
      })
    )

    assertSelectorInputValue(wrapper, dataTestSelector('focus-duration'), '24')
    assertSelectorInputValue(wrapper, dataTestSelector('short-break-duration'), '4')
    assertSelectorInputValue(wrapper, dataTestSelector('long-break-duration'), '14')
    assertSelectorInputValue(wrapper, dataTestSelector('focus-sessions-per-cycle'), '3')
  })

  it('should update timer config', async () => {
    const { timerConfigStorageService, wrapper, timer } = await mountPage(
      new TimerConfig({
        focusDuration: new Duration({ seconds: 24 }),
        shortBreakDuration: new Duration({ seconds: 4 }),
        longBreakDuration: new Duration({ seconds: 14 }),
        focusSessionsPerCycle: 3
      })
    )

    const newFocusDuration = 30
    const newShortBreakDuration = 5
    const newLongBreakDuration = 15
    const newFocusSessionsPerCycle = 4

    await wrapper.find(dataTestSelector('focus-duration')).setValue(newFocusDuration)
    await wrapper.find(dataTestSelector('short-break-duration')).setValue(newShortBreakDuration)
    await wrapper.find(dataTestSelector('long-break-duration')).setValue(newLongBreakDuration)
    await wrapper
      .find(dataTestSelector('focus-sessions-per-cycle'))
      .setValue(newFocusSessionsPerCycle)

    await wrapper.find(dataTestSelector('testing-config-save-button')).trigger('click')
    await flushPromises()

    const newConfig = new TimerConfig({
      focusDuration: new Duration({ seconds: newFocusDuration }),
      shortBreakDuration: new Duration({ seconds: newShortBreakDuration }),
      longBreakDuration: new Duration({ seconds: newLongBreakDuration }),
      focusSessionsPerCycle: newFocusSessionsPerCycle
    })
    expect(await timerConfigStorageService.get()).toEqual(newConfig)

    // Should listener also reload the timer with new config
    expect(timer.getConfig()).toEqual(newConfig)
  })
})

async function mountPage(initialTimerConfig: TimerConfig) {
  const { timerConfigStorageService, timer, communicationManager, listener } = await setUpListener({
    timerConfig: initialTimerConfig
  })
  await listener.start()
  const wrapper = mount(TestingConfigPage, {
    props: {
      port: communicationManager.clientConnect(),
      timerConfigStorageService
    }
  })
  await flushPromises()
  return { timerConfigStorageService, wrapper, timer }
}
