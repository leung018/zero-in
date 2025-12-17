import { ConfigPlugin, withDangerousMod } from 'expo/config-plugins'
import fs from 'fs'
import path from 'path'

/**
 * Config plugin to preserve Android Studio settings (.idea directory) during prebuild.
 *
 * IMPORTANT: This plugin only handles RESTORATION. The backup must be created
 * before running `expo prebuild --clean` because --clean deletes the android/
 * directory before plugins run.
 *
 * To use this:
 * 1. First run: If .idea exists, manually back it up to .android-idea-backup in project root
 *    (or run prebuild without --clean first to let the plugin create the backup)
 * 2. Subsequent runs: The plugin will automatically restore from .android-idea-backup
 *
 * Alternatively, use the prebuild-with-settings.js script which handles both backup and restore.
 */
const withPreserveAndroidStudioSettings: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot
      const androidDir = path.join(projectRoot, 'android')
      const ideaDir = path.join(androidDir, '.idea')
      const backupDir = path.join(projectRoot, '.android-idea-backup')

      // If .idea exists and no backup exists, create backup (for first run or prebuild without --clean)
      if (fs.existsSync(ideaDir) && !fs.existsSync(backupDir)) {
        console.log('💾 Backing up Android Studio settings (.idea)...')
        await fs.promises.cp(ideaDir, backupDir, { recursive: true })
        console.log('✅ Settings backed up to .android-idea-backup')
      }

      // Restore .idea from backup if it doesn't exist (after --clean regenerates android/)
      if (fs.existsSync(backupDir) && fs.existsSync(androidDir) && !fs.existsSync(ideaDir)) {
        console.log('🔄 Restoring Android Studio settings from backup...')
        await fs.promises.cp(backupDir, ideaDir, { recursive: true })
        console.log('✅ Android Studio settings restored')
      }

      return config
    }
  ])
}

export default withPreserveAndroidStudioSettings
