import { describe, expect, it } from 'vitest'
import { BackgroundListener } from './listener'
import { WorkRequestName } from './request'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'
import { PomodoroTimer } from '../domain/pomodoro/timer'
import { FakeBadgeDisplayService, type BadgeColor } from '../infra/badge'
import { Duration } from '../domain/pomodoro/duration'
import { FakeCommunicationManager } from '../infra/communication'
import { flushPromises } from '@vue/test-utils'
import config from '../config'

// Noted that below doesn't cover all the behaviors of BackgroundListener. Some of that is covered in other vue component tests.
describe('BackgroundListener', () => {
  it('should remove subscription when disconnect fired', () => {
    const { timer, clientPort } = startBackgroundListener()

    const initialSubscriptionCount = timer.getSubscriptionCount()

    clientPort.send({ name: WorkRequestName.LISTEN_TO_TIMER })

    expect(timer.getSubscriptionCount()).toBe(initialSubscriptionCount + 1)

    clientPort.disconnect()

    expect(timer.getSubscriptionCount()).toBe(initialSubscriptionCount)
  })

  it('should display badge when the timer is started', async () => {
    const { badgeDisplayService, scheduler, clientPort } = startBackgroundListener({
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
    const { badgeDisplayService, clientPort } = startBackgroundListener()

    clientPort.send({ name: WorkRequestName.START_TIMER })

    expect(badgeDisplayService.getDisplayedBadge()).not.toBeNull()

    clientPort.send({ name: WorkRequestName.PAUSE_TIMER })

    expect(badgeDisplayService.getDisplayedBadge()).toBeNull()
  })

  it('should remove badge when the timer is finished', () => {
    const { badgeDisplayService, scheduler, clientPort } = startBackgroundListener({
      focusDuration: new Duration({ seconds: 5 })
    })

    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(5000)

    expect(badgeDisplayService.getDisplayedBadge()).toBeNull()
  })

  it('should display short break badge properly', async () => {
    const { badgeDisplayService, scheduler, clientPort } = startBackgroundListener({
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
    const { badgeDisplayService, scheduler, clientPort } = startBackgroundListener({
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
})

function startBackgroundListener({
  focusDuration = new Duration({ minutes: 25 }),
  shortBreakDuration = new Duration({ minutes: 5 }),
  longBreakDuration = new Duration({ minutes: 15 }),
  numOfFocusPerCycle = 4
} = {}) {
  const scheduler = new FakePeriodicTaskScheduler()
  const timer = PomodoroTimer.createFake({
    scheduler,
    focusDuration,
    shortBreakDuration,
    longBreakDuration,
    numOfFocusPerCycle
  })
  const badgeDisplayService = new FakeBadgeDisplayService()
  const communicationManager = new FakeCommunicationManager()
  BackgroundListener.createFake({ timer, badgeDisplayService, communicationManager }).start()
  const clientPort = communicationManager.clientConnect()
  return { timer, badgeDisplayService, clientPort, scheduler }
}
