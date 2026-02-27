import { TimerInfoGetter } from '@zero-in/shared/domain/blocking-toggling'
import { TimerBasedBlockingRulesStorageService } from '@zero-in/shared/domain/timer-based-blocking/storage'
import { TimerStage } from '@zero-in/shared/domain/timer/stage'
import { WeeklySchedulesStorageService } from '../../../packages/shared/src/domain/schedules/storage'
import { Duration } from '../../../packages/shared/src/domain/timer/duration'
import { FocusSessionRecordsStorageService } from '../../../packages/shared/src/domain/timer/record/storage'
import { AppBlocker, FakeAppBlocker } from '../infra/app-block/interface'
import { findActiveOrNextScheduleSpan } from './schedules/schedule-span'

export class AppBlockTogglingService {
  private weeklySchedulesStorageService: WeeklySchedulesStorageService
  private focusSessionRecordsStorageService: FocusSessionRecordsStorageService
  private timerBasedBlockingRulesStorageService: TimerBasedBlockingRulesStorageService
  private timerInfoGetter: TimerInfoGetter
  private appBlocker: AppBlocker

  static createFake({
    weeklySchedulesStorageService = WeeklySchedulesStorageService.createFake(),
    focusSessionRecordsStorageService = FocusSessionRecordsStorageService.createFake(),
    timerBasedBlockingRulesStorageService = TimerBasedBlockingRulesStorageService.createFake(),
    timerInfoGetter = {
      getTimerInfo: () => ({
        timerStage: TimerStage.FOCUS,
        isRunning: false,
        remaining: new Duration({ seconds: 0 }),
        longBreak: new Duration({ seconds: 0 }),
        shortBreak: new Duration({ seconds: 0 })
      })
    },
    appBlocker = new FakeAppBlocker()
  }: {
    weeklySchedulesStorageService?: WeeklySchedulesStorageService
    focusSessionRecordsStorageService?: FocusSessionRecordsStorageService
    timerBasedBlockingRulesStorageService?: TimerBasedBlockingRulesStorageService
    timerInfoGetter?: TimerInfoGetter
    appBlocker?: AppBlocker
  } = {}): AppBlockTogglingService {
    return new AppBlockTogglingService({
      weeklySchedulesStorageService,
      focusSessionRecordsStorageService,
      timerBasedBlockingRulesStorageService,
      timerInfoGetter,
      appBlocker
    })
  }

  constructor({
    weeklySchedulesStorageService,
    focusSessionRecordsStorageService,
    timerBasedBlockingRulesStorageService,
    timerInfoGetter,
    appBlocker
  }: {
    weeklySchedulesStorageService: WeeklySchedulesStorageService
    focusSessionRecordsStorageService: FocusSessionRecordsStorageService
    timerBasedBlockingRulesStorageService: TimerBasedBlockingRulesStorageService
    timerInfoGetter: TimerInfoGetter
    appBlocker: AppBlocker
  }) {
    this.weeklySchedulesStorageService = weeklySchedulesStorageService
    this.focusSessionRecordsStorageService = focusSessionRecordsStorageService
    this.timerBasedBlockingRulesStorageService = timerBasedBlockingRulesStorageService
    this.timerInfoGetter = timerInfoGetter
    this.appBlocker = appBlocker
  }

  async run() {
    const timerBasedBlockingRules = await this.timerBasedBlockingRulesStorageService.get()
    const timerInfo = this.timerInfoGetter.getTimerInfo()

    if (timerBasedBlockingRules.pauseBlockingWhenTimerNotRunning) {
      if (!timerInfo.isRunning) {
        await this.clearScheduleAndUnblockApps()
        return null
      }

      const timerScheduleSpan = this.getTimerScheduleSpan(timerInfo.remaining)
      await this.unblockAppsAndSetSchedule(timerScheduleSpan)
      return timerScheduleSpan
    }

    const scheduleSpan = findActiveOrNextScheduleSpan({
      schedules: await this.weeklySchedulesStorageService.get(),
      focusSessionRecords: await this.focusSessionRecordsStorageService.get()
    })

    if (timerBasedBlockingRules.pauseBlockingDuringBreaks && this.isInBreak(timerInfo)) {
      if (!timerInfo.isRunning) {
        await this.clearScheduleAndUnblockApps()
        return null
      }

      const breakAdjustedScheduleSpan = this.getBreakAdjustedScheduleSpan(
        scheduleSpan,
        timerInfo.remaining
      )
      if (!breakAdjustedScheduleSpan) {
        await this.clearScheduleAndUnblockApps()
        return null
      }

      await this.unblockAppsAndSetSchedule(breakAdjustedScheduleSpan)
      return breakAdjustedScheduleSpan
    }

    if (scheduleSpan) {
      await this.unblockAppsAndSetSchedule(scheduleSpan)
    } else {
      await Promise.all([this.appBlocker.clearSchedule(), this.appBlocker.blockApps()])
    }

    return scheduleSpan
  }

  private getTimerScheduleSpan(remaining: Duration): { start: Date; end: Date } {
    const start = new Date()
    return {
      start,
      end: new Date(start.getTime() + remaining.totalMilliseconds)
    }
  }

  private getBreakAdjustedScheduleSpan(
    scheduleSpan: { start: Date; end: Date } | null,
    remaining: Duration
  ): { start: Date; end: Date } | null {
    if (!scheduleSpan) {
      return null
    }

    const breakEnd = new Date(Date.now() + remaining.totalMilliseconds)
    const start = breakEnd > scheduleSpan.start ? breakEnd : scheduleSpan.start

    if (start >= scheduleSpan.end) {
      return null
    }

    return {
      start,
      end: scheduleSpan.end
    }
  }

  private isInBreak(timerInfo: ReturnType<TimerInfoGetter['getTimerInfo']>): boolean {
    if (timerInfo.timerStage === TimerStage.FOCUS) {
      return false
    }

    if (timerInfo.isRunning) {
      return true
    }

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

  private async clearScheduleAndUnblockApps() {
    await Promise.all([this.appBlocker.clearSchedule(), this.appBlocker.unblockApps()])
  }

  private async unblockAppsAndSetSchedule(scheduleSpan: { start: Date; end: Date }) {
    await Promise.all([this.appBlocker.unblockApps(), this.appBlocker.setSchedule(scheduleSpan)])
  }
}
