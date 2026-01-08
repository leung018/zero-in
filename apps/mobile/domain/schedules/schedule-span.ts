import { WeeklySchedule } from '@zero-in/shared/domain/schedules'
import { getWeekdayFromDate } from '@zero-in/shared/domain/schedules/weekday'

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
 * 3. Returns the block that covers `now` (current).
 * 4. If no current block, returns the first upcoming block (next).
 *
 * @param schedules - List of weekly schedules to evaluate
 * @param now - Reference time (defaulting to check relative to 'now')
 * @returns The start and end time of the found span, or null if no schedule exists in the search window.
 */
export function findActiveOrNextScheduleSpan(
  schedules: readonly WeeklySchedule[],
  now: Date = new Date()
): ScheduleSpan | null {
  if (schedules.length === 0) return null

  const spans: ScheduleSpan[] = []

  // Generate occurrences for a window: Yesterday, Today, and the next 7 days.
  // This ensures we capture any schedule that might be active now or coming up soon.
  for (let i = -1; i <= 7; i++) {
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

        spans.push({ start, end })
      }
    }
  }

  if (spans.length === 0) return null

  // Sort by start time for merging
  spans.sort((a, b) => a.start.getTime() - b.start.getTime())

  // Merge overlapping or adjacent spans
  const merged: ScheduleSpan[] = []
  let current = spans[0]

  for (let i = 1; i < spans.length; i++) {
    const next = spans[i]
    // If next starts before or exactly when current ends, they overlap or are adjacent
    if (next.start.getTime() <= current.end.getTime()) {
      if (next.end.getTime() > current.end.getTime()) {
        current = { start: current.start, end: next.end }
      }
    } else {
      merged.push(current)
      current = next
    }
  }
  merged.push(current)

  // Find the first span that either covers 'now' or starts after 'now'.
  // Since we merged them, only one span can be 'current', or we find the 'next' one.
  for (const span of merged) {
    if (span.end.getTime() > now.getTime()) {
      return span
    }
  }

  return null
}
