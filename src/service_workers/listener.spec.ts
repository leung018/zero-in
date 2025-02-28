import { describe, expect, it } from 'vitest'
import { WorkRequestName } from './request'
import { type BadgeColor } from '../infra/badge'
import { Duration } from '../domain/pomodoro/duration'
import { flushPromises } from '@vue/test-utils'
import config from '../config'
import { startBackgroundListener } from '../test_utils/listener'

// Noted that below doesn't cover all the behaviors of BackgroundListener. Some of that is covered in other vue component tests.
describe('BackgroundListener', () => {
  it('should remove subscription when disconnect fired', () => {
    const { timer, clientPort } = startListener()

    const initialSubscriptionCount = timer.getSubscriptionCount()

    clientPort.send({ name: WorkRequestName.LISTEN_TO_TIMER })

    expect(timer.getSubscriptionCount()).toBe(initialSubscriptionCount + 1)

    clientPort.disconnect()

    expect(timer.getSubscriptionCount()).toBe(initialSubscriptionCount)
  })

  it('should display badge when the timer is started', async () => {
    const { badgeDisplayService, scheduler, clientPort } = startListener({
      focusDuration: new Duration({ minutes: 25 })
    })

    expect(badgeDisplayService.getDisplayedBadge()).toBe(null)

    clientPort.send({ name: WorkRequestName.START_TIMER })

    const focusBadgeColor: BadgeColor = config.getBadgeColorConfig().focusBadgeColor

    expect(badgeDisplayService.getDisplayedBadge()).toEqual({
      text: '25',
      color: focusBadgeColor
    })

    scheduler.advanceTime(1000)
    await flushPromises()

    // timeLeft 24:59 still display 25
    expect(badgeDisplayService.getDisplayedBadge()).toEqual({
      text: '25',
      color: focusBadgeColor
    })

    scheduler.advanceTime(59000)
    await flushPromises()

    // change to 24 only when timeLeft is 24:00
    expect(badgeDisplayService.getDisplayedBadge()).toEqual({
      text: '24',
      color: focusBadgeColor
    })
  })

  it('should remove badge when the timer is paused', () => {
    const { badgeDisplayService, clientPort } = startListener()

    clientPort.send({ name: WorkRequestName.START_TIMER })

    expect(badgeDisplayService.getDisplayedBadge()).not.toBeNull()

    clientPort.send({ name: WorkRequestName.PAUSE_TIMER })

    expect(badgeDisplayService.getDisplayedBadge()).toBeNull()
  })

  it('should remove badge when the timer is finished', () => {
    const { badgeDisplayService, scheduler, clientPort } = startListener({
      focusDuration: new Duration({ seconds: 5 })
    })

    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(5000)

    expect(badgeDisplayService.getDisplayedBadge()).toBeNull()
  })

  it('should display short break badge properly', async () => {
    const { badgeDisplayService, scheduler, clientPort } = startListener({
      focusDuration: new Duration({ seconds: 5 }),
      shortBreakDuration: new Duration({ minutes: 2 }),
      longBreakDuration: new Duration({ minutes: 4 }),
      numOfFocusPerCycle: 2
    })

    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(5000)

    // start short break
    clientPort.send({ name: WorkRequestName.START_TIMER })

    expect(badgeDisplayService.getDisplayedBadge()).toEqual({
      text: '2',
      color: config.getBadgeColorConfig().breakBadgeColor
    })
  })

  it('should display long break badge properly', async () => {
    const { badgeDisplayService, scheduler, clientPort } = startListener({
      focusDuration: new Duration({ seconds: 5 }),
      shortBreakDuration: new Duration({ minutes: 2 }),
      longBreakDuration: new Duration({ minutes: 4 }),
      numOfFocusPerCycle: 1
    })

    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(5000)

    // start long break
    clientPort.send({ name: WorkRequestName.START_TIMER })

    expect(badgeDisplayService.getDisplayedBadge()).toEqual({
      text: '4',
      color: config.getBadgeColorConfig().breakBadgeColor
    })
  })

  it('should trigger reminderService when time is up', () => {
    const { reminderService, scheduler, clientPort } = startListener({
      focusDuration: new Duration({ seconds: 5 })
    })

    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(5000)

    expect(reminderService.getTriggerCount()).toBe(1)
  })
})

function startListener({
  focusDuration = new Duration({ minutes: 25 }),
  shortBreakDuration = new Duration({ minutes: 5 }),
  longBreakDuration = new Duration({ minutes: 15 }),
  numOfFocusPerCycle = 4
} = {}) {
  const { timer, badgeDisplayService, communicationManager, scheduler, reminderService } =
    startBackgroundListener({
      timerConfig: {
        focusDuration,
        shortBreakDuration,
        longBreakDuration,
        numOfFocusPerCycle
      }
    })

  return {
    timer,
    badgeDisplayService,
    clientPort: communicationManager.clientConnect(),
    scheduler,
    reminderService
  }
}
