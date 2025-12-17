#!/usr/bin/env node

/**
 * Runs expo prebuild --clean while preserving Android Studio project settings.
 * Backs up the .idea directory before prebuild and restores it afterward.
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

const root = process.cwd()
const androidDir = path.join(root, 'android')
const ideaDir = path.join(androidDir, '.idea')
const backupDir = path.join(os.tmpdir(), `zero-in-android-idea-${Date.now()}`)

function backupIdea() {
  if (!fs.existsSync(ideaDir)) {
    console.log('ℹ️  No .idea directory found, skipping backup')
    return false
  }

  console.log('💾 Backing up Android Studio settings (.idea)...')
  fs.mkdirSync(backupDir, { recursive: true })

  // Copy the entire .idea directory
  copyRecursiveSync(ideaDir, path.join(backupDir, '.idea'))
  console.log(`✅ Settings backed up to ${backupDir}`)
  return true
}

function restoreIdea() {
  const backupIdeaDir = path.join(backupDir, '.idea')

  if (!fs.existsSync(backupIdeaDir)) {
    return
  }

  console.log('🔄 Restoring Android Studio settings...')

  // Ensure android directory exists (it should after prebuild)
  if (!fs.existsSync(androidDir)) {
    console.log('⚠️  Android directory not found, cannot restore settings')
    return
  }

  // Remove existing .idea if it exists (from prebuild)
  if (fs.existsSync(ideaDir)) {
    fs.rmSync(ideaDir, { recursive: true, force: true })
  }

  // Restore from backup
  copyRecursiveSync(backupIdeaDir, ideaDir)
  console.log('✅ Android Studio settings restored')

  // Clean up backup
  fs.rmSync(backupDir, { recursive: true, force: true })
  console.log('🧹 Backup cleaned up')
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src)
  const stats = exists && fs.statSync(src)
  const isDirectory = exists && stats.isDirectory()

  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true })
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName))
    })
  } else {
    fs.copyFileSync(src, dest)
  }
}

function main() {
  try {
    const hasIdea = backupIdea()

    console.log('\n🔨 Running expo prebuild --clean...')
    execSync('expo prebuild --clean', {
      stdio: 'inherit',
      cwd: root
    })

    if (hasIdea) {
      console.log('\n')
      restoreIdea()
    }

    console.log('\n✅ Prebuild complete!')
  } catch (error) {
    console.error('\n❌ Error during prebuild:', error.message)

    // Try to restore settings even if prebuild failed
    if (fs.existsSync(backupDir)) {
      console.log('\n🔄 Attempting to restore settings after error...')
      restoreIdea()
    }

    process.exit(1)
  }
}

main()
