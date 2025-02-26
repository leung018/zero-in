import { beforeEach, describe, expect, it } from 'vitest'
import { BackgroundListener } from './listener'
import { WorkRequestName } from './request'
import { FakePeriodicTaskScheduler } from '../infra/scheduler'
import { PomodoroTimer } from '../domain/pomodoro/timer'
import { FakeBadgeDisplayService } from '../infra/badge'
import { Duration } from '../domain/pomodoro/duration'
import { FakeCommunicationManager } from '../infra/communication'

// Noted that below doesn't cover all the behaviors of BackgroundListener. Some of that is covered in other vue component tests.
describe('BackgroundListener', () => {
  let scheduler: FakePeriodicTaskScheduler

  beforeEach(() => {
    scheduler = new FakePeriodicTaskScheduler()
  })

  it('should display badge when the timer is started', () => {
    const timer = PomodoroTimer.createFake({
      scheduler,
      focusDuration: new Duration({ minutes: 25 })
    })
    const badgeDisplayService = new FakeBadgeDisplayService()
    const communicationManager = new FakeCommunicationManager()
    BackgroundListener.createFake({ timer, badgeDisplayService, communicationManager }).start()

    expect(badgeDisplayService.getDisplayedBadge()).toBe(null)

    communicationManager.clientConnect().send({ name: WorkRequestName.POMODORO_START })

    expect(badgeDisplayService.getDisplayedBadge()).toEqual({
      text: '25',
      textColor: '#ffffff',
      backgroundColor: '#ff0000'
    })
  })
})
