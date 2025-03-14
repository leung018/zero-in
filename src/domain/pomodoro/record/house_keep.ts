import { PomodoroRecordStorageService } from './storage'

export class PomodoroRecordHousekeeper {
  static async houseKeep({
    now = new Date(),
    pomodoroRecordStorageService,
    houseKeepDays
  }: {
    now?: Date
    pomodoroRecordStorageService: PomodoroRecordStorageService
    houseKeepDays: number
  }) {
    const oldestDate = new Date(now)
    oldestDate.setDate(oldestDate.getDate() - houseKeepDays)

    const records = await pomodoroRecordStorageService.getAll()
    const newRecords = records.filter((record) => record.completedAt >= oldestDate)
    await pomodoroRecordStorageService.saveAll(newRecords)
  }
}
