import { afterEach } from 'node:test'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { assertToThrowError } from '../test_utils/check_error'
import { FakeClock } from '../utils/clock'
import {
  FakePeriodicTaskScheduler,
  PeriodicTaskSchedulerImpl,
  TaskSchedulingError
} from './scheduler'

describe('PeriodicTaskSchedulerImpl', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should execute the callback according the schedules', () => {
    const mock = vi.fn(() => {})

    const scheduler = new PeriodicTaskSchedulerImpl()
    scheduler.scheduleTask(mock, 1000)

    expect(mock).not.toHaveBeenCalled()
    vi.advanceTimersByTime(2001)
    expect(mock).toHaveBeenCalledTimes(2)
  })

  it('should first task execute after startAfterMs if it is specified', () => {
    const mock = vi.fn(() => {})

    const scheduler = new PeriodicTaskSchedulerImpl()
    scheduler.scheduleTask(mock, 50, 500)

    vi.advanceTimersByTime(499)
    expect(mock).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(mock).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(50)
    expect(mock).toHaveBeenCalledTimes(2)
  })

  it('should able to stop scheduled task', () => {
    const mock = vi.fn(() => {})

    const scheduler = new PeriodicTaskSchedulerImpl()

    scheduler.scheduleTask(mock, 1000)
    scheduler.stopTask()

    vi.advanceTimersByTime(10000)
    expect(mock).not.toHaveBeenCalled()
  })

  it('should throw error when scheduleTask without previous scheduled task is stopped', () => {
    const scheduler = new PeriodicTaskSchedulerImpl()

    const mock = vi.fn(() => {})

    scheduler.scheduleTask(() => {}, 1000)

    assertToThrowError(() => {
      scheduler.scheduleTask(mock, 1000)
    }, TaskSchedulingError.taskAlreadyScheduledError())

    vi.advanceTimersByTime(1500)
    expect(mock).not.toHaveBeenCalled()

    scheduler.stopTask()
    scheduler.scheduleTask(mock, 1000)

    vi.advanceTimersByTime(1500)
    expect(mock).toHaveBeenCalledTimes(1)
  })

  it('should able to stop task in the scheduled task', () => {
    const mock = vi.fn(() => {})

    const scheduler = new PeriodicTaskSchedulerImpl()
    scheduler.scheduleTask(() => {
      mock()
      scheduler.stopTask()
    }, 1000)

    vi.advanceTimersByTime(3000)

    expect(mock).toHaveBeenCalledTimes(1)
  })
})

describe('FakePeriodicTaskScheduler', () => {
  it('should execute the callback according the schedules', () => {
    const mock = vi.fn(() => {})

    const { scheduler, clock } = setupScheduler()
    scheduler.scheduleTask(mock, 1000)

    expect(mock).not.toHaveBeenCalled()
    clock.advanceTime(1500)
    expect(mock).toHaveBeenCalledTimes(1)

    clock.advanceTime(500)
    expect(mock).toHaveBeenCalledTimes(2)
  })

  it('should first task execute after startAfterMs if it is specified', () => {
    const mock = vi.fn(() => {})

    const { scheduler, clock } = setupScheduler()
    scheduler.scheduleTask(mock, 50, 500)

    clock.advanceTime(499)
    expect(mock).not.toHaveBeenCalled()

    clock.advanceTime(1)
    expect(mock).toHaveBeenCalledTimes(1)

    clock.advanceTime(50)
    expect(mock).toHaveBeenCalledTimes(2)
  })

  it('should able to stop scheduled task', () => {
    const mock = vi.fn(() => {})

    const { scheduler, clock } = setupScheduler()

    scheduler.scheduleTask(mock, 1000)
    scheduler.stopTask()

    clock.advanceTime(10000)
    expect(mock).not.toHaveBeenCalled()
  })

  it('should throw error when scheduleTask without previous scheduled task is stopped', () => {
    const { scheduler, clock } = setupScheduler()

    const mock = vi.fn(() => {})

    scheduler.scheduleTask(() => {}, 1000)

    assertToThrowError(() => {
      scheduler.scheduleTask(mock, 1000)
    }, TaskSchedulingError.taskAlreadyScheduledError())

    clock.advanceTime(1500)
    expect(mock).not.toHaveBeenCalled()

    scheduler.stopTask()
    scheduler.scheduleTask(mock, 1000)

    clock.advanceTime(1500)
    expect(mock).toHaveBeenCalledTimes(1)
  })

  it('should able to stop task in the scheduled task', () => {
    const mock = vi.fn(() => {})

    const { scheduler, clock } = setupScheduler()
    scheduler.scheduleTask(() => {
      mock()
      scheduler.stopTask()
    }, 1000)

    clock.advanceTime(3000)

    expect(mock).toHaveBeenCalledTimes(1)
  })

  function setupScheduler() {
    const clock = new FakeClock()
    const scheduler = new FakePeriodicTaskScheduler(clock)
    return { scheduler, clock }
  }
})
