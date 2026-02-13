import { Duration } from '../../../../apps/extension/src/domain/timer/duration'
import { TimerStage } from '../../../../apps/extension/src/domain/timer/stage'
import { isSameDay } from '../utils/date'
import { WeeklySchedule } from './schedules'
import { WeeklySchedulesStorageService } from './schedules/storage'
import { TimerBasedBlockingRulesStorageService } from './timer-based-blocking/storage'
import { FocusSessionRecordsStorageService } from './timer/record/storage'

export interface TimerInfoGetter {
  getTimerInfo(): {
    timerStage: TimerStage
    isRunning: boolean
    remaining: Duration
    longBreak: Duration
    shortBreak: Duration
  }
}

export class ShouldActivateBlockingTeller {
  private weeklySchedulesStorageService: WeeklySchedulesStorageService
  private focusSessionRecordsStorageService: FocusSessionRecordsStorageService
  private timerBasedBlockingRulesStorageService: TimerBasedBlockingRulesStorageService
  private timerInfoGetter: TimerInfoGetter

  constructor({
    weeklySchedulesStorageService,
    focusSessionRecordsStorageService,
    timerBasedBlockingRulesStorageService,
    timerInfoGetter
  }: {
    weeklySchedulesStorageService: WeeklySchedulesStorageService
    focusSessionRecordsStorageService: FocusSessionRecordsStorageService
    timerBasedBlockingRulesStorageService: TimerBasedBlockingRulesStorageService
    timerInfoGetter: TimerInfoGetter
  }) {
    this.weeklySchedulesStorageService = weeklySchedulesStorageService
    this.focusSessionRecordsStorageService = focusSessionRecordsStorageService
    this.timerBasedBlockingRulesStorageService = timerBasedBlockingRulesStorageService
    this.timerInfoGetter = timerInfoGetter
  }

  async shouldActivateBlocking(): Promise<boolean> {
    const timerBasedBlockingRules = await this.timerBasedBlockingRulesStorageService.get()

    if (timerBasedBlockingRules.pauseBlockingWhenTimerNotRunning && !this.isRunning()) {
      return false
    }

    if (timerBasedBlockingRules.pauseBlockingDuringBreaks && this.isInBreak()) {
      return false
    }

    const schedules = await this.weeklySchedulesStorageService.get()

    if (schedules.length === 0) {
      return true
    }

    return this.isAnyScheduleActive(schedules)
  }

  private async isAnyScheduleActive(
    inputSchedules: ReadonlyArray<WeeklySchedule>
  ): Promise<boolean> {
    const now = new Date()
    const schedules = inputSchedules.filter((schedule) => schedule.isContain(now))

    const focusSessionRecords = await this.focusSessionRecordsStorageService.get()

    for (const schedule of schedules) {
      if (!schedule.targetFocusSessions) {
        return true
      }
      const completedSessions = focusSessionRecords.filter(
        (record) => isSameDay(record.completedAt, now) && schedule.isContain(record.completedAt)
      )
      if (completedSessions.length < schedule.targetFocusSessions) {
        return true
      }
    }

    return false
  }

  private isInBreak(): boolean {
    const timerInfo = this.timerInfoGetter.getTimerInfo()
    if (timerInfo.timerStage === TimerStage.FOCUS) {
      return false
    }
    if (timerInfo.isRunning) {
      return true
    }

    // If user hasn't pressed the start of the timer even the stage is break, still is not in break yet.
    if (
      timerInfo.timerStage === TimerStage.SHORT_BREAK &&
      timerInfo.shortBreak.totalMilliseconds <= timerInfo.remaining.totalMilliseconds
    ) {
      return false
    }
    if (
      timerInfo.timerStage === TimerStage.LONG_BREAK &&
      timerInfo.longBreak.totalMilliseconds <= timerInfo.remaining.totalMilliseconds
    ) {
      return false
    }
    return true
  }

  private isRunning(): boolean {
    const timerInfo = this.timerInfoGetter.getTimerInfo()
    return timerInfo.isRunning
  }
}
