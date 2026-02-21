import { isScheduleInstanceCompleteTarget } from '@zero-in/shared/domain/is-schedule-complete-target'
import { ScheduleInstance, WeeklySchedule } from '@zero-in/shared/domain/schedules'
import { getWeekdayFromDate } from '@zero-in/shared/domain/schedules/weekday'
import { FocusSessionRecord } from '../../../../packages/shared/src/domain/timer/record'

export type ScheduleSpan = {
  start: Date
  end: Date
}

/**
 * Finds the longest current or next schedule block.
 *
 * Behavior:
 * 1. Checks current and upcoming days for active schedules.
 * 2. Combines overlapping or adjacent schedules into continuous blocks (longest possible).
 * 3. Excludes schedule instances that have completed their targetFocusSessions.
 * 4. Returns the block that covers `now` (current).
 * 5. If no current block, returns the first upcoming block (next).
 *
 * @param schedules - List of weekly schedules to evaluate
 * @param now - Reference time (defaulting to check relative to 'now')
 * @param focusSessionRecords - Focus session records to check completion status
 * @returns The start and end time of the found span, or null if no schedule exists in the search window.
 */
export function findActiveOrNextScheduleSpan(
  schedules: readonly WeeklySchedule[],
  now: Date = new Date(),
  focusSessionRecords: readonly FocusSessionRecord[] = []
): ScheduleSpan | null {
  if (schedules.length === 0) return null

  const instances = getScheduleInstancesWithin7Days(schedules, now)

  // Filter out completed schedule instances
  const activeInstances = instances.filter(
    (instance) => !isScheduleInstanceCompleteTarget(instance, focusSessionRecords)
  )

  // Sort by start time for merging
  activeInstances.sort((a, b) => a.start.getTime() - b.start.getTime())

  // Merge overlapping or adjacent instances
  let merged: ScheduleSpan | null = activeInstances[0]

  for (let i = 1; i < activeInstances.length; i++) {
    const next = activeInstances[i]
    // If next starts before or exactly when current ends, they overlap or are adjacent
    if (next.start.getTime() <= merged.end.getTime()) {
      if (next.end.getTime() > merged.end.getTime()) {
        merged = {
          start: merged.start,
          end: next.end
        }
      }
    } else {
      // Check if current merged instance covers or is after 'now'
      if (merged.end.getTime() > now.getTime()) {
        return {
          start: merged.start,
          end: merged.end
        }
      }
      merged = next
    }
  }

  // Return the final merged instance if it covers or is after 'now'
  if (merged && merged.end.getTime() > now.getTime()) {
    return {
      start: merged.start,
      end: merged.end
    }
  }

  return null
}

function getScheduleInstancesWithin7Days(
  schedules: readonly WeeklySchedule[],
  now: Date = new Date()
): ScheduleInstance[] {
  const instances: ScheduleInstance[] = []

  for (let i = 0; i <= 7; i++) {
    const day = new Date(now)
    day.setDate(now.getDate() + i)
    day.setHours(0, 0, 0, 0)

    const weekday = getWeekdayFromDate(day)

    for (const schedule of schedules) {
      if (schedule.weekdaySet.has(weekday)) {
        const start = new Date(day)
        start.setHours(schedule.startTime.hour, schedule.startTime.minute, 0, 0)

        const end = new Date(day)
        end.setHours(schedule.endTime.hour, schedule.endTime.minute, 0, 0)

        const instance = new ScheduleInstance({
          start,
          end,
          targetFocusSessions: schedule.targetFocusSessions
        })

        instances.push(instance)
      }
    }
  }

  return instances
}
