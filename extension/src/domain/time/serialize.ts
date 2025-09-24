import { Time } from '.'

export type SerializedTime = {
  hour: number
  minute: number
}

export function serializeTime(time: Time): SerializedTime {
  return {
    hour: time.hour,
    minute: time.minute
  }
}

export function deserializeTime(data: SerializedTime): Time {
  return new Time(data.hour, data.minute)
}
