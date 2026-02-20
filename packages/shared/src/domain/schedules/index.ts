import { Time } from '@zero-in/shared/domain/time/index'
import { Weekday, getWeekdayFromDate } from './weekday'

/**
 * A date-specific schedule instance with absolute start/end times.
 * Represents a single occurrence of a weekly schedule on a specific date.
 */
export class ScheduleInstance {
  readonly start: Date
  readonly end: Date
  readonly targetFocusSessions: number | null

  constructor({
    start,
    end,
    targetFocusSessions = null
  }: {
    start: Date
    end: Date
    targetFocusSessions?: number | null
  }) {
    this.start = start
    this.end = end
    this.targetFocusSessions = targetFocusSessions
  }

  isContain(timestamp: Date): boolean {
    return timestamp >= this.start && timestamp < this.end
  }
}

/**
 * A repeating weekly schedule template.
 */
export class WeeklySchedule {
  weekdaySet: ReadonlySet<Weekday>
  readonly startTime: Time
  readonly endTime: Time
  readonly targetFocusSessions: number | null

  constructor({
    weekdaySet,
    startTime,
    endTime,
    targetFocusSessions = null
  }: {
    weekdaySet: ReadonlySet<Weekday>
    startTime: Time
    endTime: Time
    targetFocusSessions?: number | null
  }) {
    if (weekdaySet.size === 0) {
      throw new Error('weekdaySet must not be empty')
    }
    if (!startTime.isBefore(endTime)) {
      throw new Error('startTime must be before endTime')
    }

    this.weekdaySet = weekdaySet
    this.startTime = startTime
    this.endTime = endTime

    if (targetFocusSessions && targetFocusSessions > 0) {
      this.targetFocusSessions = targetFocusSessions
    } else {
      this.targetFocusSessions = null
    }
  }

  /**
   * Checks if the time represented by the given date is within the schedule.
   * Note: If the endTime is the same as the time of the date, it will return false.
   * e.g. If the schedule ends at 5:00 PM and the date's time is exactly 5:00 PM, it will return false.
   */
  isContain(date: Date): boolean {
    const scheduleInstance = this.getInstanceForDate(date)
    if (!scheduleInstance) {
      return false
    }
    return scheduleInstance.isContain(date)
  }

  /**
   * Gets the date-specific schedule instance for a given date if the weekday matches.
   * Returns null if the date's weekday is not in this schedule's weekdaySet.
   */
  getInstanceForDate(date: Date): ScheduleInstance | null {
    const weekday = getWeekdayFromDate(date)
    if (!this.weekdaySet.has(weekday)) {
      return null
    }

    const start = new Date(date)
    start.setHours(this.startTime.hour, this.startTime.minute, 0, 0)

    const end = new Date(date)
    end.setHours(this.endTime.hour, this.endTime.minute, 0, 0)

    return new ScheduleInstance({
      start,
      end,
      targetFocusSessions: this.targetFocusSessions
    })
  }
}
