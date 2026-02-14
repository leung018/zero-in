import { TimerStage } from '@zero-in/shared/domain/timer/stage'
import { getNumberWithOrdinal } from '@zero-in/shared/utils/format'

// Tests of it is covered by component test of FocusTimerPage.spec.ts

export class StageDisplayLabelHelper {
  private readonly focusSessionsPerCycle: number

  constructor({ focusSessionsPerCycle }: { focusSessionsPerCycle: number }) {
    this.focusSessionsPerCycle = focusSessionsPerCycle
  }

  getStageLabel({
    stage,
    focusSessionsCompleted
  }: {
    stage: TimerStage
    focusSessionsCompleted: number
  }): string {
    switch (stage) {
      case TimerStage.SHORT_BREAK:
        return this.getShortBreakLabel(focusSessionsCompleted)
      case TimerStage.LONG_BREAK:
        return this.getLongBreakLabel()
      default:
        return this.getFocusLabel(focusSessionsCompleted + 1)
    }
  }

  getLongBreakLabel(): string {
    if (this.focusSessionsPerCycle > 1) {
      return 'Long Break'
    }
    return 'Break'
  }

  getFocusLabel(nth: number): string {
    if (this.focusSessionsPerCycle > 1) {
      return `${getNumberWithOrdinal(nth)} Focus`
    }
    return 'Focus'
  }

  getShortBreakLabel(nth: number): string {
    return `${getNumberWithOrdinal(nth)} Break`
  }
}
