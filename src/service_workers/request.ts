import { TimerConfig } from '../domain/timer/config'
import {
  deserializeTimerConfig,
  SerializedTimerConfig,
  serializeTimerConfig
} from '../domain/timer/config/serialize'

export enum WorkRequestName {
  TOGGLE_BROWSING_RULES,
  START_TIMER,
  QUERY_TIMER_STATE,
  PAUSE_TIMER,
  RESTART_FOCUS,
  RESTART_SHORT_BREAK,
  RESTART_LONG_BREAK,
  RESET_TIMER_CONFIG,
  RESET_NOTIFICATION,
  PING,
  RELOAD_LISTENER
}

export type RestartNthPayload = {
  nth: number
}

export type ResetTimerConfigPayload = SerializedTimerConfig

export function newTimerConfig(data: ResetTimerConfigPayload) {
  return deserializeTimerConfig(data)
}

export type WorkRequest =
  | {
      name: WorkRequestName.TOGGLE_BROWSING_RULES
    }
  | {
      name: WorkRequestName.START_TIMER
    }
  | {
      name: WorkRequestName.QUERY_TIMER_STATE
    }
  | {
      name: WorkRequestName.PAUSE_TIMER
    }
  | {
      name: WorkRequestName.RESTART_FOCUS
      payload: RestartNthPayload
    }
  | {
      name: WorkRequestName.RESTART_SHORT_BREAK
      payload: RestartNthPayload
    }
  | {
      name: WorkRequestName.RESTART_LONG_BREAK
    }
  | {
      name: WorkRequestName.RESET_TIMER_CONFIG
      payload: ResetTimerConfigPayload
    }
  | {
      name: WorkRequestName.RESET_NOTIFICATION
    }
  | {
      name: WorkRequestName.PING
    }
  | {
      name: WorkRequestName.RELOAD_LISTENER
    }

export function newResetTimerConfigRequest(config: TimerConfig): WorkRequest {
  return {
    name: WorkRequestName.RESET_TIMER_CONFIG,
    payload: serializeTimerConfig(config)
  }
}
