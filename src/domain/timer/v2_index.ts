import { CurrentDateService } from '../../infra/current_date'
import { getDateAfter } from '../../utils/date'
import { TimerConfig } from './config'
import { TimerStage } from './stage'
import { TimerStateV2 } from './v2_state'

export class FocusTimerV2 {
  static createFake({
    stubbedDate = new Date(),
    timerConfig = TimerConfig.newTestInstance()
  } = {}) {
    return new FocusTimerV2({
      currentDateService: CurrentDateService.createFake(stubbedDate),
      timerConfig
    })
  }

  private currentDateService: CurrentDateService
  private timerConfig: TimerConfig

  private constructor({
    currentDateService,
    timerConfig
  }: {
    currentDateService: CurrentDateService
    timerConfig: TimerConfig
  }) {
    this.currentDateService = currentDateService
    this.timerConfig = timerConfig
  }

  getState() {
    return new TimerStateV2({
      startAt: this.currentDateService.getDate(),
      endAt: getDateAfter(this.currentDateService.getDate(), this.timerConfig.focusDuration),
      isRunning: false,
      stage: TimerStage.FOCUS,
      focusSessionsCompleted: 0
    })
  }
}
