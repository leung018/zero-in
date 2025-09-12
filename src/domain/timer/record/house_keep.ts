import { FocusSessionRecordsStorageService } from './storage'

export class FocusSessionRecordHousekeeper {
  static async houseKeep({
    now = new Date(),
    focusSessionRecordsStorageService,
    houseKeepDays
  }: {
    now?: Date
    focusSessionRecordsStorageService: FocusSessionRecordsStorageService
    houseKeepDays: number
  }) {
    const oldestDate = new Date(now)
    oldestDate.setDate(oldestDate.getDate() - houseKeepDays)

    const records = await focusSessionRecordsStorageService.get()
    const newRecords = records.filter((record) => record.completedAt >= oldestDate)
    await focusSessionRecordsStorageService.save(newRecords)
  }
}
