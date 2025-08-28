import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import config from '../config'
import { TimerConfig } from '../domain/timer/config'
import { Duration } from '../domain/timer/duration'
import { FakeActionService } from '../infra/action'
import { assertSelectorCheckboxValue, assertSelectorInputValue } from '../test_utils/assert'
import { setUpListener } from '../test_utils/listener'
import { dataTestSelector } from '../test_utils/selector'
import TimerSettingPage from './TimerSettingPage.vue'

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

    assertSelectorInputValue(wrapper, dataTestSelector('focus-duration'), '24')
    assertSelectorInputValue(wrapper, dataTestSelector('short-break-duration'), '4')
    assertSelectorInputValue(wrapper, dataTestSelector('long-break-duration'), '13')
    assertSelectorInputValue(wrapper, dataTestSelector('focus-sessions-per-cycle'), '3')
  })

  it('should check perform cycle, show short break and focus sessions per cycle when focus sessions per cycles higher than 1', async () => {
    const { wrapper } = await mountPage(
      TimerConfig.newTestInstance({
        focusSessionsPerCycle: 2
      })
    )

    assertSelectorCheckboxValue(wrapper, dataTestSelector('perform-cycle'), true)
    expect(wrapper.find(dataTestSelector('short-break-duration')).isVisible()).toBe(true)
    expect(wrapper.find(dataTestSelector('focus-sessions-per-cycle')).isVisible()).toBe(true)
  })

  it('should uncheck perform cycle, hide short break and focus sessions per cycle when focus sessions per cycles equal to 1', async () => {
    const { wrapper } = await mountPage(
      TimerConfig.newTestInstance({
        focusSessionsPerCycle: 1
      })
    )

    assertSelectorCheckboxValue(wrapper, dataTestSelector('perform-cycle'), false)
    expect(wrapper.find(dataTestSelector('short-break-duration')).isVisible()).toBe(false)
    expect(wrapper.find(dataTestSelector('focus-sessions-per-cycle')).isVisible()).toBe(false)
  })

  it('should update timer config', async () => {
    const { timerConfigStorageService, wrapper, timer } = await mountPage(
      new TimerConfig({
        focusDuration: new Duration({ minutes: 24 }),
        shortBreakDuration: new Duration({ minutes: 4 }),
        longBreakDuration: new Duration({ minutes: 14 }),
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

    await saveSetting(wrapper)

    const newConfig = new TimerConfig({
      focusDuration: new Duration({ minutes: newFocusDuration }),
      shortBreakDuration: new Duration({ minutes: newShortBreakDuration }),
      longBreakDuration: new Duration({ minutes: newLongBreakDuration }),
      focusSessionsPerCycle: newFocusSessionsPerCycle
    })
    expect(await timerConfigStorageService.get()).toEqual(newConfig)

    // Should listener also reload the timer with new config
    expect(timer.getConfig()).toEqual(newConfig)
  })

  it('should reset the timer after update config', async () => {
    const { wrapper, timer } = await mountPage(
      TimerConfig.newTestInstance({
        focusDuration: new Duration({ minutes: 24 })
      })
    )
    timer.start()

    await wrapper.find(dataTestSelector('focus-duration')).setValue(1)
    await saveSetting(wrapper)

    expect(timer.getExternalState().remaining).toEqual(new Duration({ minutes: 1 }))
    expect(timer.getExternalState().isRunning).toBe(false)
  })

  it('should ignore the value of short break when perform cycle is unchecked', async () => {
    const { timerConfigStorageService, wrapper } = await mountPage(
      TimerConfig.newTestInstance({
        focusSessionsPerCycle: 3,
        shortBreakDuration: new Duration({ minutes: 4 })
      })
    )

    const newShortBreakDuration = 0
    await wrapper.find(dataTestSelector('short-break-duration')).setValue(newShortBreakDuration)

    await wrapper.find(dataTestSelector('perform-cycle')).setValue(false)

    await saveSetting(wrapper)

    const newConfig = await timerConfigStorageService.get()
    expect(newConfig.shortBreakDuration).toEqual(new Duration({ minutes: 4 }))
  })

  it('should set focus sessions per cycle to 1 when perform cycle is unchecked', async () => {
    const { timerConfigStorageService, wrapper } = await mountPage(
      TimerConfig.newTestInstance({
        focusSessionsPerCycle: 3
      })
    )

    await wrapper.find(dataTestSelector('perform-cycle')).setValue(false)

    await saveSetting(wrapper)

    const newConfig = await timerConfigStorageService.get()
    expect(newConfig.focusSessionsPerCycle).toBe(1)
  })

  it('should trigger notifierService after clicked save', async () => {
    const { wrapper, updateSuccessNotifierService } = await mountPage()

    expect(updateSuccessNotifierService.hasTriggered()).toBe(false)

    await saveSetting(wrapper)

    expect(updateSuccessNotifierService.hasTriggered()).toBe(true)
  })

  it('should able to load preset default', async () => {
    const { wrapper, timerConfigStorageService } = await mountPage(
      new TimerConfig({
        focusDuration: new Duration({ minutes: 24 }),
        shortBreakDuration: new Duration({ minutes: 4 }),
        longBreakDuration: new Duration({ minutes: 13 }),
        focusSessionsPerCycle: 1
      })
    )

    await wrapper.find(dataTestSelector('preset-default')).trigger('click')

    await saveSetting(wrapper)

    expect(await timerConfigStorageService.get()).toEqual(config.getDefaultTimerConfig())
  })

  it('should able to load preset 52/17', async () => {
    const { wrapper, timerConfigStorageService } = await mountPage(
      new TimerConfig({
        focusDuration: new Duration({ minutes: 24 }),
        shortBreakDuration: new Duration({ minutes: 4 }),
        longBreakDuration: new Duration({ minutes: 13 }),
        focusSessionsPerCycle: 3
      })
    )

    await wrapper.find(dataTestSelector('preset-52-17')).trigger('click')

    await saveSetting(wrapper)

    const expectedConfig = new TimerConfig({
      focusDuration: new Duration({ minutes: 52 }),
      shortBreakDuration: new Duration({ minutes: 4 }), // Keep original short break duration
      longBreakDuration: new Duration({ minutes: 17 }),
      focusSessionsPerCycle: 1
    })
    expect(await timerConfigStorageService.get()).toEqual(expectedConfig)
  })

  it('should loading preset 52/17 keep the short break and update perform cycle properly in ui', async () => {
    const { wrapper } = await mountPage(
      TimerConfig.newTestInstance({
        shortBreakDuration: new Duration({ minutes: 4 }),
        focusSessionsPerCycle: 3
      })
    )

    await wrapper.find(dataTestSelector('preset-52-17')).trigger('click')

    assertSelectorInputValue(wrapper, dataTestSelector('short-break-duration'), '4')
    assertSelectorCheckboxValue(wrapper, dataTestSelector('perform-cycle'), false)
  })
})

async function mountPage(initialTimerConfig: TimerConfig = TimerConfig.newTestInstance()) {
  const { timerConfigStorageService, timer, communicationManager, listener } = await setUpListener({
    timerConfig: initialTimerConfig
  })
  await listener.start()

  const updateSuccessNotifierService = new FakeActionService()
  const wrapper = mount(TimerSettingPage, {
    props: {
      port: communicationManager.clientConnect(),
      timerConfigStorageService,
      updateSuccessNotifierService
    }
  })
  await flushPromises()
  return {
    timerConfigStorageService,
    timer,
    wrapper,
    communicationManager,
    updateSuccessNotifierService
  }
}

async function saveSetting(wrapper: VueWrapper<any>) {
  await wrapper.find(dataTestSelector('timer-setting-save-button')).trigger('click')
  await flushPromises()
}
