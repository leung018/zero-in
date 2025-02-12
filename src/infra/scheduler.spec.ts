import { afterEach } from 'node:test'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PeriodicTaskSchedulerImpl, TaskSchedulingError } from './scheduler'
import { assertToThrowError } from '../test_utils/check_error'

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
    }, new TaskSchedulingError('Task is already scheduled. Stop the task before scheduling a new one.'))

    vi.advanceTimersByTime(1500)
    expect(mock).not.toHaveBeenCalled()

    scheduler.stopTask()
    scheduler.scheduleTask(mock, 1000)

    vi.advanceTimersByTime(1500)
    expect(mock).toHaveBeenCalledTimes(1)
  })
})
