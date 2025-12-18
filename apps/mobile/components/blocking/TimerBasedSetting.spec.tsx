import { fireEvent, render, RenderAPI, waitFor } from '@testing-library/react-native'
import {
  newTestTimerBasedBlockingRules,
  type TimerBasedBlockingRules
} from '@zero-in/shared/domain/timer-based-blocking'
import { TimerBasedBlockingRulesStorageService } from '@zero-in/shared/domain/timer-based-blocking/storage'
import React from 'react'
import { TimerBasedSetting } from './TimerBasedSetting'

describe('TimerBasedSetting', () => {
  it('should render saved setting', async () => {
    const { wrapper: wrapper1 } = await renderTimerBasedSetting({
      timerBasedBlockingRules: {
        pauseBlockingDuringBreaks: false,
        pauseBlockingWhenTimerNotRunning: true
      }
    })

    expect(wrapper1.getByTestId('pause-blocking-during-breaks').props.value).toBe(false)
    expect(wrapper1.getByTestId('pause-blocking-when-timer-not-running').props.value).toBe(true)

    const { wrapper: wrapper2 } = await renderTimerBasedSetting({
      timerBasedBlockingRules: {
        pauseBlockingDuringBreaks: true,
        pauseBlockingWhenTimerNotRunning: false
      }
    })

    expect(wrapper2.getByTestId('pause-blocking-during-breaks').props.value).toBe(true)
    expect(wrapper2.getByTestId('pause-blocking-when-timer-not-running').props.value).toBe(false)
  })

  it('should persist setting after clicking save', async () => {
    const { wrapper, timerBasedBlockingRulesStorageService } = await renderTimerBasedSetting({
      timerBasedBlockingRules: newTestTimerBasedBlockingRules({
        pauseBlockingDuringBreaks: false,
        pauseBlockingWhenTimerNotRunning: true
      })
    })

    const expectedRules: TimerBasedBlockingRules = newTestTimerBasedBlockingRules({
      pauseBlockingDuringBreaks: true,
      pauseBlockingWhenTimerNotRunning: false
    })

    saveTimerBasedBlockingRules(wrapper, expectedRules)

    await waitFor(async () => {
      expect(await timerBasedBlockingRulesStorageService.get()).toEqual(expectedRules)
    })
  })
})

async function renderTimerBasedSetting({
  timerBasedBlockingRules = newTestTimerBasedBlockingRules()
}: {
  timerBasedBlockingRules?: TimerBasedBlockingRules
} = {}) {
  const timerBasedBlockingRulesStorageService = TimerBasedBlockingRulesStorageService.createFake()
  await timerBasedBlockingRulesStorageService.save(timerBasedBlockingRules)

  const wrapper: RenderAPI = render(
    <TimerBasedSetting
      timerBasedBlockingRulesStorageService={timerBasedBlockingRulesStorageService}
    />
  )

  // Wait for the component to be rendered
  await wrapper.findByTestId('pause-blocking-during-breaks')

  return { wrapper, timerBasedBlockingRulesStorageService }
}

function saveTimerBasedBlockingRules(
  wrapper: RenderAPI,
  timerBasedBlockingRules: TimerBasedBlockingRules = newTestTimerBasedBlockingRules({
    pauseBlockingDuringBreaks: false,
    pauseBlockingWhenTimerNotRunning: false
  })
) {
  const pauseDuringBreaksSwitch = wrapper.getByTestId('pause-blocking-during-breaks')
  fireEvent(
    pauseDuringBreaksSwitch,
    'valueChange',
    timerBasedBlockingRules.pauseBlockingDuringBreaks
  )

  const pauseWhenNotRunningSwitch = wrapper.getByTestId('pause-blocking-when-timer-not-running')
  fireEvent(
    pauseWhenNotRunningSwitch,
    'valueChange',
    timerBasedBlockingRules.pauseBlockingWhenTimerNotRunning
  )

  const saveButton = wrapper.getByTestId('save-timer-integration-button')
  fireEvent.press(saveButton)
}
