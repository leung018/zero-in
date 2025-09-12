import { FocusSessionRecordStorageService } from './storage'

export class FocusSessionRecordHousekeeper {
  static async houseKeep({
    now = new Date(),
    focusSessionRecordStorageService,
    houseKeepDays
  }: {
    now?: Date
    focusSessionRecordStorageService: FocusSessionRecordStorageService
    houseKeepDays: number
  }) {
    const oldestDate = new Date(now)
    oldestDate.setDate(oldestDate.getDate() - houseKeepDays)

    const records = await focusSessionRecordStorageService.get()
    const newRecords = records.filter((record) => record.completedAt >= oldestDate)
    await focusSessionRecordStorageService.save(newRecords)
  }
}
