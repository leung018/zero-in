import { ConfigPlugin, withInfoPlist } from 'expo/config-plugins'
import fs from 'fs'
import path from 'path'

const withGIDClientID: ConfigPlugin = (config) => {
  return withInfoPlist(config, (config) => {
    const plistPath = path.resolve(
      config.modRequest.projectRoot,
      config.ios?.googleServicesFile || 'GoogleService-Info.plist'
    )

    if (fs.existsSync(plistPath)) {
      const plistContent = fs.readFileSync(plistPath, 'utf8')

      const match = plistContent.match(/<key>CLIENT_ID<\/key>\s*<string>(.*?)<\/string>/)
      if (match && match[1]) {
        config.modResults.GIDClientID = match[1]
        console.log(`✅ Added GIDClientID from ${plistPath}`)
      } else {
        console.warn(`⚠️ Could not find CLIENT_ID in ${plistPath}`)
      }
    } else {
      console.warn(`⚠️ ${plistPath} not found`)
    }

    return config
  })
}

export default withGIDClientID
