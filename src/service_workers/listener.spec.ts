import { describe, expect, it } from 'vitest'
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
  it('should remove subscription when disconnect fired', () => {
    const { timer, clientPort } = startBackgroundListener()

    const initialSubscriptionCount = timer.getSubscriptionCount()

    clientPort.send({ name: WorkRequestName.LISTEN_TO_TIMER })

    expect(timer.getSubscriptionCount()).toBe(initialSubscriptionCount + 1)

    clientPort.disconnect()

    expect(timer.getSubscriptionCount()).toBe(initialSubscriptionCount)
  })

  it('should display badge when the timer is started', async () => {
    const { badgeDisplayService, scheduler, clientPort } = startBackgroundListener()

    expect(badgeDisplayService.getDisplayedBadge()).toBe(null)

    clientPort.send({ name: WorkRequestName.START_TIMER })
    scheduler.advanceTime(1000)
    await flushPromises()

    expect(badgeDisplayService.getDisplayedBadge()).toEqual({
      text: '25',
      textColor: '#ffffff',
      backgroundColor: '#ff0000'
    })
  })
})

function startBackgroundListener({ focusDuration = new Duration({ minutes: 25 }) } = {}) {
  const scheduler = new FakePeriodicTaskScheduler()
  const timer = PomodoroTimer.createFake({ scheduler, focusDuration })
  const badgeDisplayService = new FakeBadgeDisplayService()
  const communicationManager = new FakeCommunicationManager()
  BackgroundListener.createFake({ timer, badgeDisplayService, communicationManager }).start()
  const clientPort = communicationManager.clientConnect()
  return { timer, badgeDisplayService, clientPort, scheduler }
}
