import { describe, expect, it } from 'vitest'
import { DailyRefreshTimeStorageService } from '../domain/statistics/daily_refresh_time'
import { flushPromises, mount } from '@vue/test-utils'
import StatisticsPage from './StatisticsPage.vue'
import { Time } from '../domain/schedules/time'

describe('StatisticsPage', () => {
  it('should render saved daily refresh time', async () => {
    const dailyRefreshTimeStorageService = DailyRefreshTimeStorageService.createFake()
    dailyRefreshTimeStorageService.save(new Time(10, 30))

    const { wrapper } = mountDailyRefreshTimePage({
      dailyRefreshTimeStorageService
    })
    await flushPromises()

    const timerInput = wrapper.find("[data-test='timer-input']").element as HTMLInputElement
    expect(timerInput.value).toBe('10:30')
  })
})

function mountDailyRefreshTimePage({
  dailyRefreshTimeStorageService = DailyRefreshTimeStorageService.createFake()
} = {}) {
  const wrapper = mount(StatisticsPage, {
    props: {
      dailyRefreshTimeStorageService
    }
  })
  return { wrapper }
}
