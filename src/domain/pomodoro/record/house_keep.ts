import { PomodoroRecordStorageService } from './storage'

export class PomodoroRecordHousekeeper {
  private pomodoroRecordStorageService: PomodoroRecordStorageService
  private houseKeepDays: number

  constructor({
    pomodoroRecordStorageService,
    houseKeepDays
  }: {
    pomodoroRecordStorageService: PomodoroRecordStorageService
    houseKeepDays: number
  }) {
    this.pomodoroRecordStorageService = pomodoroRecordStorageService
    this.houseKeepDays = houseKeepDays
  }

  async houseKeep(now: Date = new Date()) {
    const oldestDate = new Date(now)
    oldestDate.setDate(oldestDate.getDate() - this.houseKeepDays)

    const records = await this.pomodoroRecordStorageService.getAll()
    const newRecords = records.filter((record) => record.completedAt >= oldestDate)
    await this.pomodoroRecordStorageService.saveAll(newRecords)
  }
}
