import { beforeEach, describe, expect, it } from 'vitest'
import { BackgroundListener } from './listener'
import { WorkRequestName } from './request'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'
import { PomodoroTimer } from '../domain/pomodoro/timer'
import { FakeBadgeDisplayService } from '../infra/badge'
import { Duration } from '../domain/pomodoro/duration'
import { FakeCommunicationManager } from '../infra/communication'
import { flushPromises } from '@vue/test-utils'

// Noted that below doesn't cover all the behaviors of BackgroundListener. Some of that is covered in other vue component tests.
describe('BackgroundListener', () => {
  let scheduler: FakePeriodicTaskScheduler

  beforeEach(() => {
    scheduler = new FakePeriodicTaskScheduler()
  })

  it('should remove subscription when disconnect fired', () => {
    const timer = PomodoroTimer.createFake({ scheduler })
    const communicationManager = new FakeCommunicationManager()
    BackgroundListener.createFake({ timer, communicationManager }).start()

    const clientPort = communicationManager.clientConnect()
    clientPort.send({ name: WorkRequestName.POMODORO_QUERY })

    clientPort.disconnect()

    expect(timer.getSubscriptionCount()).toBe(0)
  })

  it('should display badge when the timer is started', async () => {
    const timer = PomodoroTimer.createFake({
      scheduler,
      focusDuration: new Duration({ minutes: 25 })
    })
    const badgeDisplayService = new FakeBadgeDisplayService()
    const communicationManager = new FakeCommunicationManager()
    BackgroundListener.createFake({ timer, badgeDisplayService, communicationManager }).start()

    expect(badgeDisplayService.getDisplayedBadge()).toBe(null)

    communicationManager.clientConnect().send({ name: WorkRequestName.POMODORO_START })
    scheduler.advanceTime(1000)
    await flushPromises()

    expect(badgeDisplayService.getDisplayedBadge()).toEqual({
      text: '25',
      textColor: '#ffffff',
      backgroundColor: '#ff0000'
    })
  })
})
