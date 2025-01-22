import { describe, expect, it } from 'vitest'
import {
  WeeklyScheduleStorageServiceImpl,
  type WeeklyScheduleStorageService
} from '../../domain/schedules/storage'
import { flushPromises, mount } from '@vue/test-utils'

import WeeklySchedulesEditor from '../WeeklySchedulesEditor.vue'
import { Weekday, WeeklySchedule } from '../../domain/schedules'

describe('WeeklySchedulesEditor', () => {
  it('should render weekly schedules', async () => {
    const weeklyScheduleStorageService = WeeklyScheduleStorageServiceImpl.createFake()
    weeklyScheduleStorageService.saveAll([
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.Mon, Weekday.Tue]),
        startTime: { hour: 7, minute: 0 },
        endTime: { hour: 9, minute: 1 }
      }),
      new WeeklySchedule({
        weekdaySet: new Set([Weekday.Wed]),
        startTime: { hour: 6, minute: 2 },
        endTime: { hour: 8, minute: 4 }
      })
    ])

    const { wrapper } = mountWeeklySchedulesEditor({
      weeklyScheduleStorageService
    })
    await flushPromises()

    const weeklySchedules = wrapper.findAll("[data-test='weekly-schedule']")
    expect(weeklySchedules).toHaveLength(2)

    expect(weeklySchedules[0].text()).toContain('Mon')
    expect(weeklySchedules[0].text()).toContain('Tue')
    expect(weeklySchedules[0].text()).toContain('07:00')
    expect(weeklySchedules[0].text()).toContain('09:01')

    expect(weeklySchedules[1].text()).toContain('Wed')
    expect(weeklySchedules[1].text()).toContain('06:02')
    expect(weeklySchedules[1].text()).toContain('08:04')
  })
})

function mountWeeklySchedulesEditor({
  weeklyScheduleStorageService = WeeklyScheduleStorageServiceImpl.createFake()
}: {
  weeklyScheduleStorageService?: WeeklyScheduleStorageService
}) {
  const wrapper = mount(WeeklySchedulesEditor, {
    props: { weeklyScheduleStorageService }
  })
  return {
    wrapper,
    weeklyScheduleStorageService
  }
}
